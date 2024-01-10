export const ACTIVITYSTATES_KEY = 'activity-states';
export const ACTIVITYSTATES_TYPE = 'activity-states';

export function createActivityStatesIdentifier(namespace = '') {
  return {
    key: ACTIVITYSTATES_KEY,
    namespace
  };
}
