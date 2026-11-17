/* Optional cloud sync (Supabase). Local-first: the app always works from this device's storage.
   When signed in, changes are merged with your private cloud row and shared with your other devices.
   Leave the keys in config.js empty to keep the app local-only. */
(function (BT) {
  'use strict';
  const S = BT.store, KEY = 'bt.auth', conf = () => BT.config.supabase || {};
  let auth = null, busy = false, again = false, merging = false, timer = null, lastTry = 0;
  const state = { last: null, error: '' };
  try { auth = JSON.parse(localStorage.getItem(KEY)); } catch (e) { /* signed out */ }

  const enabled = () => !!(conf().url && conf().anonKey);
  // tolerate a pasted URL with a trailing slash or an extra /rest/v1 or /auth/v1 on the end
  const base = () => String(conf().url || '').trim().replace(/\/+$/, '').replace(/\/(rest|auth)\/v1.*$/, '');
  const key = () => String(conf().anonKey || '').trim();
  const keep = a => { auth = a; try { if (a) localStorage.setItem(KEY, JSON.stringify(a)); else localStorage.removeItem(KEY); } catch (e) { /* ignore */ } };
  const tell = () => window.dispatchEvent(new Event('bt:sync'));
  const session = r => ({ access_token: r.access_token, refresh_token: r.refresh_token, expires_at: Date.now() + (r.expires_in || 3600) * 1000, email: r.user && r.user.email });

  async function call(path, opts, authed) {
    const headers = Object.assign({ apikey: key(), 'Content-Type': 'application/json' }, authed ? { Authorization: 'Bearer ' + auth.access_token } : {}, opts.headers || {});
    const res = await fetch(base() + path, Object.assign({}, opts, { headers }));
    const text = await res.text();
    let body = null; try { body = text ? JSON.parse(text) : null; } catch (e) { /* not json */ }
    if (!res.ok) {
      const err = new Error((body && (body.msg || body.error_description || body.message)) || 'Request failed (' + res.status + ')');
      err.status = res.status; throw err;
    }
    return body;
  }

  async function fresh() {            // refresh the sign-in token shortly before it expires
    if (auth.expires_at - Date.now() > 60000) return;
    try { keep(session(await call('/auth/v1/token?grant_type=refresh_token', { method: 'POST', body: JSON.stringify({ refresh_token: auth.refresh_token }) }, false))); }
    catch (e) { if (e.status >= 400 && e.status < 500) { keep(null); throw new Error('Signed out. Please sign in again.'); } throw e; }
  }

  async function backup(reason, data) {   // dated copy in the cloud; a failure never blocks normal syncing
    try {
      const d = data || S.snapshot();
      if (!(d.expenses || []).length) return false;
      await call('/rest/v1/user_backups', { method: 'POST', body: JSON.stringify({ reason, expense_count: d.expenses.length, data: d }) }, true);
      const old = await call('/rest/v1/user_backups?select=id&order=created_at.desc&offset=30', { method: 'GET' }, true);   // keep the newest 30
      if (old && old.length) await call('/rest/v1/user_backups?id=in.(' + old.map(x => x.id).join(',') + ')', { method: 'DELETE' }, true);
      return true;
    } catch (e) { return false; }      // the backups table is optional (see supabase/backups.sql)
  }
  const lastDay = () => { try { return localStorage.getItem('bt.lastBackup'); } catch (e) { return ''; } };

  async function run() {              // pull, merge, push. Retries if another device wrote in between.
    if (!enabled() || !auth) return;
    if (busy) { again = true; return; }
    busy = true; state.error = ''; lastTry = Date.now();
    try {
      if (!navigator.onLine) throw new Error('Offline. It will sync when you are back online.');
      await fresh();
      for (let i = 0; i < 4; i++) {
        const row = (await call('/rest/v1/user_data?select=data,updated_at', { method: 'GET' }, true))[0];
        const remote = (row && row.data) || {};          // never let a reset overwrite a cloud copy that has expenses without saving it first
        if ((remote.expenses || []).length && (S.snapshot().resetAt || 0) > (remote.resetAt || 0)) await backup('Before a reset or import replaced the cloud copy', remote);
        if (row) { merging = true; try { S.mergeRemote(row.data || {}); } finally { merging = false; } }
        const body = JSON.stringify({ data: S.snapshot(), updated_at: new Date().toISOString() });
        if (!row) {
          try { await call('/rest/v1/user_data', { method: 'POST', body }, true); break; }
          catch (e) { if (e.status === 409) continue; throw e; }
        }
        const done = await call('/rest/v1/user_data?updated_at=eq.' + encodeURIComponent(row.updated_at), { method: 'PATCH', body, headers: { Prefer: 'return=representation' } }, true);
        if (done && done.length) break;
      }
      state.last = new Date();
      const day = new Date().toISOString().slice(0, 10);
      if (lastDay() !== day && await backup('Daily backup')) { try { localStorage.setItem('bt.lastBackup', day); } catch (e) { /* ignore */ } }
    } catch (e) { state.error = e.message || 'Sync failed'; }
    busy = false; tell();
    if (again) { again = false; schedule(500); }
  }
  function schedule(ms) { clearTimeout(timer); timer = setTimeout(run, ms); }

  BT.sync = {
    enabled,
    signedIn: () => !!auth,
    email: () => (auth && auth.email) || '',
    statusText: () => state.error ? 'Not synced: ' + state.error
      : state.last ? 'Last synced ' + state.last.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Waiting to sync...',
    now: run,
    backupNow: async () => { await fresh(); return backup('Manual backup'); },
    async backups() { await fresh(); return call('/rest/v1/user_backups?select=id,created_at,reason,expense_count&order=created_at.desc&limit=30', { method: 'GET' }, true); },
    async backupData(id) { await fresh(); const r = await call('/rest/v1/user_backups?select=data&id=eq.' + encodeURIComponent(id), { method: 'GET' }, true); return r && r[0] && r[0].data; },
    async signIn(email, password) {
      keep(session(await call('/auth/v1/token?grant_type=password', { method: 'POST', body: JSON.stringify({ email, password }) }, false)));
      run(); return {};
    },
    async signUp(email, password) {
      const r = await call('/auth/v1/signup', { method: 'POST', body: JSON.stringify({ email, password }) }, false);
      if (r && r.access_token) { keep(session(r)); run(); return {}; }
      return { needsConfirm: true };
    },
    signOut() { keep(null); state.last = null; state.error = ''; },
    init() {
      if (!enabled()) return;
      S.subscribe(() => { if (auth && !merging) schedule(2000); });
      window.addEventListener('online', () => { if (auth) schedule(500); });
      document.addEventListener('visibilitychange', () => { if (!document.hidden && auth && Date.now() - lastTry > 30000) schedule(300); });
      if (auth) schedule(300);
    }
  };
})(window.BT);
