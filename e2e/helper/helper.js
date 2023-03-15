/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2023, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT is licensed under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 *
 * Open MCT includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/

import { expect } from '../../../../pluginFixtures';

/**
 * @param {import('@playwright/test').Page} page
 * @param {object} plan
 * @param {string} viewUrl
 */
export async function assertPlanActivities(page, plan, viewUrl) {
    const groups = Object.keys(plan);
    for (const group of groups) {
        for (let i = 0; i < plan[group].length; i++) {
            const startBound = plan[group][0].start;
            let endBound = plan[group][i].end;
            if (endBound === startBound) {
                // Prevent oddities with setting start and end bound equal
                // via URL params
                endBound += 1;
            }

            // Switch to fixed time mode with all plan events within the bounds
            await page.goto(`${viewUrl}?tc.mode=fixed&tc.startBound=${startBound}&tc.endBound=${endBound}&tc.timeSystem=utc&view=plan.view`);
            const eventCount = await page.locator('.activity-bounds').count();
            expect(eventCount).toEqual(Object.values(plan)
                .flat()
                .filter(event =>
                    activitiesWithinTimeBounds(event.start, event.end, startBound, endBound)).length);
        }
    }
}

/**
* @param {number} eventStart the start time of the first activity
* @param {number} eventEnd the end time of the first activity
* @param {number} timeBoundStart the start time of the second activity
* @param {number} timeBoundEnd the end time of the second activity
* @returns {boolean} true if the activities overlap, false otherwise
*/
function activitiesWithinTimeBounds(eventStart, eventEnd, timeBoundStart, timeBoundEnd) {
    return (eventStart >= timeBoundStart && eventStart <= timeBoundEnd)
         || (eventEnd >= timeBoundStart && eventEnd <= timeBoundEnd)
         || (timeBoundStart >= eventStart && timeBoundStart <= eventEnd)
         || (timeBoundEnd >= eventStart && timeBoundEnd <= eventEnd);
}
