/* eslint-disable prettier/prettier */
/**
 * Constants which may be used across all e2e tests.
 */

/**
 * Time Constants
 * - Used for overriding the browser clock in tests.
 */
export const MISSION_TIME = 1732413600000; // Saturday, November 23, 2024 6:00:00 PM GMT-08:00 (Thanksgiving Dinner Time)

/**
 * URL Constants
 * - This is the URL that the browser will be directed to when running visual tests. This URL 
 *    - hides the tree and inspector to prevent visual noise
 *    - sets the time bounds to a fixed range
 */
export const VISUAL_URL = './#/browse/mine?tc.mode=fixed&tc.startBound=1693592063607&tc.endBound=1693593893607&tc.timeSystem=utc&view=grid&hideInspector=true&hideTree=true';
