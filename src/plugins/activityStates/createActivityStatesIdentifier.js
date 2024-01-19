export const ACTIVITY_STATES_KEY = 'activity-states';
export const ACTIVITY_STATES_TYPE = 'activity-states';

export function createActivityStatesIdentifier(namespace = '') {
  return {
    key: ACTIVITY_STATES_KEY,
    namespace
  };
}
