/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2022, United States Government
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
const { getFocusedObjectUuid, getHashUrlToDomainObject } = require('../../../appActions');
const { test, expect } = require('../../../pluginFixtures');
const Buffer = require('buffer').Buffer;

const testPlan = {
    "TEST_GROUP": [
        {
            "name": "Past event 1",
            "start": 1660320408000,
            "end": 1660343797000,
            "type": "TEST-GROUP",
            "color": "orange",
            "textColor": "white"
        },
        {
            "name": "Past event 2",
            "start": 1660406808000,
            "end": 1660429160000,
            "type": "TEST-GROUP",
            "color": "orange",
            "textColor": "white"
        },
        {
            "name": "Past event 3",
            "start": 1660493208000,
            "end": 1660503981000,
            "type": "TEST-GROUP",
            "color": "orange",
            "textColor": "white"
        },
        {
            "name": "Past event 4",
            "start": 1660579608000,
            "end": 1660624108000,
            "type": "TEST-GROUP",
            "color": "orange",
            "textColor": "white"
        },
        {
            "name": "Past event 5",
            "start": 1660666008000,
            "end": 1660681529000,
            "type": "TEST-GROUP",
            "color": "orange",
            "textColor": "white"
        }
    ]
};

async function createPlanFromJSON(page, { name, json }) {
    //Click the Create button
    await page.click('button:has-text("Create")');

    // Click 'Plan' menu option
    await page.click(`li:text("Plan")`);

    // Modify the name input field of the domain object to accept 'name'
    if (name) {
        const nameInput = page.locator('form[name="mctForm"] .first input[type="text"]');
        await nameInput.fill("");
        await nameInput.fill(name);
    }

    // Upload buffer from memory
    await page.locator('input#fileElem').setInputFiles({
        name: 'plan.txt',
        mimeType: 'text/plain',
        buffer: Buffer.from(JSON.stringify(json))
    });

    // Click OK button and wait for Navigate event
    await Promise.all([
        page.waitForLoadState(),
        page.click('[aria-label="Save"]'),
        // Wait for Save Banner to appear
        page.waitForSelector('.c-message-banner__message')
    ]);

    // Wait until the URL is updated
    await page.waitForURL(`**/mine/*`);
    const uuid = await getFocusedObjectUuid(page);
    const objectUrl = await getHashUrlToDomainObject(page, uuid);

    return {
        uuid,
        url: objectUrl
    };
}

test.describe("Plan", () => {
    test("Create a Plan and display all plan events @unstable", async ({ page }) => {
        await page.goto('./', { waitUntil: 'networkidle' });

        const plan = await createPlanFromJSON(page, {
            name: 'Test Plan',
            json: testPlan
        });
        const startBound = testPlan.TEST_GROUP[0].start;
        const endBound = testPlan.TEST_GROUP[testPlan.TEST_GROUP.length - 1].end;

        // Switch to fixed time mode with all plan events within the bounds
        await page.goto(`${plan.url}?tc.mode=fixed&tc.startBound=${startBound}&tc.endBound=${endBound}&tc.timeSystem=utc&view=plan.view`);
        const eventCount = await page.locator('.activity-bounds').count();
        expect(eventCount).toEqual(testPlan.TEST_GROUP.length);
    });
});

