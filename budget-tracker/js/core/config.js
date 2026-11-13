/* App configuration. These are the defaults; changes made in Settings are saved on the device and applied on top. */
(function (BT) {
  'use strict';
  const defaults = {
    currency: '฿',
    dailyGoal: 350,                  // per day, drives the progress line on the Log screen
    categories: [
      { id: 'eat-out', name: 'Eat out', budget: 1200 },
      { id: 'education', name: 'Education', budget: 600 },
      { id: 'entertainment', name: 'Entertainment', budget: 600 },
      { id: 'food', name: 'Food', budget: 1800 },
      { id: 'rent', name: 'Rent', budget: 3000, fixed: true },
      { id: 'shopping', name: 'Shopping', budget: 600 },
      { id: 'transportation', name: 'Transportation', budget: 700 },
      { id: 'travel', name: 'Travel', budget: 400 },
      { id: 'laundry', name: 'Laundry', budget: 150 },
      { id: '7-11', name: '7-11', budget: 300 },
      { id: 'gym', name: 'Gym', budget: 400 }
    ]
  };
  const copy = list => list.map(c => Object.assign({}, c));

  BT.config = {
    defaults,
    currency: defaults.currency,
    dailyGoal: defaults.dailyGoal,
    termMonths: 4,                   // length of the "Term" period on Stats
    heat: [150, 300, 450],           // calendar shading steps (amount per day)
    supabase: { url: 'https://klbelvflrdoyhldztteq.supabase.co/rest/v1/', anonKey: 'sb_publishable_WmObhMQuQlBCFvjcd_CC1w_IKnGihlo' },   // optional cloud sync: paste your Supabase project URL and anon / publishable key (see README)
    categories: copy(defaults.categories),
    currencies: [['฿', 'Thai baht'], ['$', 'US dollar'], ['€', 'Euro'], ['£', 'British pound'], ['¥', 'Japanese yen'],
      ['₩', 'Korean won'], ['₹', 'Indian rupee'], ['S$', 'Singapore dollar'], ['RM', 'Malaysian ringgit']],
    name(id) { const c = this.categories.find(x => x.id === id); return c ? c.name : 'Other'; },
    apply(s) {                       // merge saved settings over the defaults
      if (typeof s.currency === 'string' && s.currency) this.currency = s.currency;
      if (s.dailyGoal > 0) this.dailyGoal = s.dailyGoal;
      if (Array.isArray(s.categories) && s.categories.length) this.categories = copy(s.categories);
    }
  };
})(window.BT);
