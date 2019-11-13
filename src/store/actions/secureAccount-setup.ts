// types and action creators: dispatched by components and sagas
export const SETUP_SECUREACCOUNT =  "SETUP_SECUREACCOUNT";

export const setupSecureAccount = () => {
    return { type: SETUP_SECUREACCOUNT };
  };
// types and action creators (saga): dispatched by saga workers
export const SECUREACCOUNT_SETUP = "SECUREACCOUNT_SETUP";

export const secureAccountSetup = (setupData) => {
    return {type: SECUREACCOUNT_SETUP, payload: setupData};
  };