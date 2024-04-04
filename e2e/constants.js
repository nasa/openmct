/**
 * Constants which may be used across all e2e tests.
 */

/**
 * Time Constants
 * - Used for overriding the browser clock in tests.
 */
export const MISSION_TIME = 1732413600000; // Saturday, November 23, 2024 6:00:00 PM GMT-08:00 (Thanksgiving Dinner Time)
// Subtracting 30 minutes from MISSION_TIME
export const MISSION_TIME_FIXED_START = 1732413600000 - 1800000; // 1732411800000

// Adding 1 minute to MISSION_TIME
export const MISSION_TIME_FIXED_END = 1732413600000 + 60000; // 1732413660000
/**
 * URL Constants
 * These constants are used for initial navigation in visual tests, in either fixed or realtime mode.
 * They navigate to the 'My Items' folder at MISSION_TIME.
 * They set the following url parameters:
 *  - tc.mode - The time conductor mode ('fixed' or 'local')
 *  - tc.startBound - The time conductor start bound (when in fixed mode)
 *  - tc.endBound - The time conductor end bound (when in fixed mode)
 *  - tc.startDelta - The time conductor start delta (when in realtime mode)
 *  - tc.endDelta - The time conductor end delta (when in realtime mode)
 *  - tc.timeSystem - The time conductor time system ('utc')
 *  - view - The view to display ('grid')
 *  - hideInspector - Whether to hide the inspector (true)
 *  - hideTree - Whether to hide the tree (true)
 * @typedef {string} VisualUrl
 */

/** @type {VisualUrl} */
export const VISUAL_FIXED_URL = `./#/browse/mine?tc.mode=fixed&tc.startBound=${MISSION_TIME_FIXED_START}&tc.endBound=${MISSION_TIME_FIXED_END}&tc.timeSystem=utc&view=grid&hideInspector=true&hideTree=true`;
/** @type {VisualUrl} */
export const VISUAL_REALTIME_URL =
  './#/browse/mine?tc.mode=local&tc.timeSystem=utc&view=grid&tc.startDelta=1800000&tc.endDelta=30000&hideTree=true&hideInspector=true';
