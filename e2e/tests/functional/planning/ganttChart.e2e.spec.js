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
const { test, expect } = require('../../../pluginFixtures');
const { createPlanFromJSON, createDomainObjectWithDefaults } = require('../../../appActions');
const { testPlan1, testPlan2 } = require('./util/examplePlans');
const { assertPlanActivities } = require('./util/helper');

test.describe("Gantt Chart", () => {
    let ganttChart;
    test.beforeEach(async ({ page }) => {
        await page.goto('./', { waitUntil: 'networkidle' });
        ganttChart = await createDomainObjectWithDefaults(page, {
            type: 'Gantt Chart'
        });
        await createPlanFromJSON(page, {
            json: testPlan1,
            parent: ganttChart.uuid
        });
    });

    test("Displays all plan events", async ({ page }) => {
        await page.goto(ganttChart.url);

        await assertPlanActivities(page, testPlan1, ganttChart.url);
    });
    test("Replaces a plan with a new plan", async ({ page }) => {
        await assertPlanActivities(page, testPlan1, ganttChart.url);
        await createPlanFromJSON(page, {
            json: testPlan2,
            parent: ganttChart.uuid
        });
        const replaceModal = page.getByRole('dialog').filter({ hasText: "This action will replace the current Plan. Do you want to continue?" });
        await expect(replaceModal).toBeVisible();
        await page.getByRole('button', { name: 'OK' }).click();

        await assertPlanActivities(page, testPlan2, ganttChart.url);
    });
});
