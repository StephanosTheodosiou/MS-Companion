// F15: the first-time setup has one step count, used by every screen in it.
//   1 Welcome  ->  2 Create account  ->  3 Your data (consent)  ->  4 About you (profile)
// Someone who logs in without having finished setup continues at step 3.
export const SETUP_STEPS = {
  welcome: 1,
  createAccount: 2,
  consent: 3,
  profile: 4,
  total: 4,
} as const;
