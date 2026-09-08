/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2024, United States Government
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
// @ts-check
/*
This test suite is dedicated to tests which verify the basic operations surrounding conditionSets and styling
*/
import {
  createDomainObjectWithDefaults,
  linkParameterToObject,
  navigateToObjectWithFixedTimeBounds,
  setEndOffset,
  setRealTimeMode,
  waitForFormattedTelemetryValue
} from '../../../../appActions.js';
import { expect, test } from '../../../../pluginFixtures.js';

test.describe('A Condition Widget', () => {
  let swg;
  /**
   * @type {import('../../../../appActions.js').CreatedObjectInfo}
   */
  let conditionSet;
  /**
   * @type {import('../../../../appActions.js').CreatedObjectInfo}
   */
  let conditionWidget;

  test.beforeEach(async ({ page }) => {
    // Install the clock and set the time to the mission time such that the state generator will be controllable
    await page.goto('./', { waitUntil: 'domcontentloaded' });
    // Create Condition Set, State Generator, and Display Layout
    conditionSet = await createDomainObjectWithDefaults(page, {
      type: 'Condition Set',
      name: 'Test Condition Set'
    });
    swg = await createDomainObjectWithDefaults(page, {
      type: 'Sine Wave Generator',
      name: 'Test SWG Generator'
    });

    conditionWidget = await createDomainObjectWithDefaults(page, {
      type: 'Condition Widget',
      name: 'Test Condition Widget'
    });

    await setRealTimeMode(page);

    // set up the condition set to use the state generator
    await page.goto(conditionSet.url);

    // Add the SWG to the Condition Set by dragging from the main tree
    await page.getByLabel('Show selected item in tree').click();
    await page
      .getByRole('tree', {
        name: 'Main Tree'
      })
      .getByRole('treeitem', {
        name: swg.name
      })
      .dragTo(page.locator('#conditionCollection'));

    // Add the state generator to the first criterion such that there is a condition named 'OFF' when the state generator is off
    await page.getByLabel('Add Condition').click();
    await page.getByLabel('Condition Name Input').first().fill('< 0');
    await page
      .getByLabel('Criterion Telemetry Selection')
      .first()
      .selectOption({ label: 'any telemetry' });
    await page.getByLabel('Criterion Metadata Selection').first().selectOption({ label: 'Sine' });
    await page
      .getByLabel('Criterion Comparison Selection')
      .first()
      .selectOption({ label: 'is less than' });
    await page.getByLabel('Criterion Input').first().fill('0');
    await page.getByLabel('Condition Output Type').first().selectOption({ value: 'string' });
    await page.getByLabel('Condition Output String').first().fill('< 0');

    await page.getByLabel('Add Condition').click();
    await page.getByLabel('Condition Name Input').first().fill('> 0');
    await page
      .getByLabel('Criterion Telemetry Selection')
      .first()
      .selectOption({ label: 'any telemetry' });
    await page.getByLabel('Criterion Metadata Selection').first().selectOption({ label: 'Sine' });
    await page
      .getByLabel('Criterion Comparison Selection')
      .first()
      .selectOption({ label: 'is greater than or equal to' });
    await page.getByLabel('Criterion Input').first().fill('0');
    await page.getByLabel('Condition Output Type').first().selectOption({ value: 'string' });
    await page.getByLabel('Condition Output String').first().fill('> 0');

    await page.getByLabel('Save').click();
    await page.getByRole('listitem', { name: 'Save and Finish Editing' }).click();

    await linkParameterToObject(page, swg.name, conditionSet.name);

    //First, verify that it works correctly without a staleness rule applied.
    await page.goto(conditionWidget.url);

    await page.getByLabel('Edit Object').click();
    await page.getByRole('button', { name: 'Use Conditional Styling...' }).click();
    const overlay = page.getByLabel('Modal Overlay');
    await overlay.getByLabel('Search Input').fill('Test Condition Set');
    await overlay.getByLabel('Preview Test Condition Set').click();
    await overlay.getByLabel('Save').click();
    // Something about the way we have implemented toggles does not sit right with
    // Playwright and we cannot use either .click() or .check() here.
    await page.getByLabel('Use Condition Set output as label').dispatchEvent('click');
    await page.getByRole('button', { name: 'Save' }).click();
    await page.getByRole('listitem', { name: 'Save and Finish Editing' }).click();

    //Refresh to get the updated object configuration
    await page.reload();
  });

  test('Shows correct output when no staleness rule is applied', async ({ page }) => {
    test.info().annotations.push({
      type: 'issue',
      description: 'https://github.com/nasa/openmct/issues/8277'
    });

    const conditionSetIdentifier = {
      namespace: '',
      key: conditionSet.uuid
    };

    const label = page.getByLabel('Test Condition Widget Object View');

    await expect(page.getByLabel('Browse bar object name')).toBeVisible();
    await waitForFormattedTelemetryValue({
      page,
      identifier: conditionSetIdentifier
    });

    await expect(label.getByText('default')).toBeHidden();
    await waitForFormattedTelemetryValue({
      page,
      identifier: conditionSetIdentifier,
      expectedValue: '> 0'
    });
    await expect(label.getByText('> 0')).toBeVisible();
    await waitForFormattedTelemetryValue({
      page,
      identifier: conditionSetIdentifier,
      expectedValue: '< 0'
    });
    await expect(label.getByText('< 0')).toBeVisible();
  });

  test('Shows the correct output when a staleness rule is applied', async ({ page }) => {
    test.info().annotations.push({
      type: 'issue',
      description: 'https://github.com/nasa/openmct/issues/8277'
    });
    await page.goto(conditionSet.url);
    await page.getByLabel('Edit Object').click();
    await page.getByLabel('Add Condition').click();

    await page.getByLabel('Condition Name Input').first().fill('STALE');
    await page
      .getByLabel('Criterion Telemetry Selection')
      .first()
      .selectOption({ label: 'any telemetry' });
    await page
      .getByLabel('Criterion Metadata Selection')
      .first()
      .selectOption({ label: 'any data received' });
    await page
      .getByLabel('Criterion Comparison Selection')
      .first()
      .selectOption({ label: 'is stale' });
    await page.getByLabel('Condition Output Type').first().selectOption({ value: 'string' });
    await page.getByLabel('Condition Output String').first().fill('STALE');

    await page.getByLabel('Save').click();
    await page.getByRole('listitem', { name: 'Save and Finish Editing' }).click();
    await page.getByLabel('Navigate to Test SWG Generator generator Object').click({
      button: 'right'
    });
    await page.getByLabel('Edit Properties').click();
    await page.getByLabel('Provide Staleness Updates').click();
    await page.getByRole('button', { name: 'Save' }).click();

    await page.goto(conditionWidget.url);

    const conditionSetIdentifier = {
      namespace: '',
      key: conditionSet.uuid
    };

    await expect(page.getByLabel('Browse bar object name')).toHaveText('Test Condition Widget');
    const label = page.getByLabel('Test Condition Widget Object View');
    await waitForFormattedTelemetryValue({
      page,
      identifier: conditionSetIdentifier,
      expectedValue: '> 0'
    });
    await expect(label.getByText('> 0')).toBeVisible();
    await waitForFormattedTelemetryValue({
      page,
      identifier: conditionSetIdentifier,
      expectedValue: '< 0'
    });
    await expect(label.getByText('< 0')).toBeVisible();
    await waitForFormattedTelemetryValue({
      page,
      identifier: conditionSetIdentifier,
      expectedValue: 'STALE'
    });
    await expect(label.getByText('STALE')).toBeVisible();
  });

  test('Keeps updating the label in fixed time mode when the end bound is in the future', async ({
    page
  }) => {
    const conditionSetIdentifier = {
      namespace: '',
      key: conditionSet.uuid
    };

    // View the widget in fixed time mode with an end bound an hour in the future, so that incoming
    // realtime telemetry continues to fall within the bounds of the time conductor.
    const now = Date.now();
    await navigateToObjectWithFixedTimeBounds(
      page,
      conditionWidget.url,
      now - 60 * 60 * 1000,
      now + 60 * 60 * 1000
    );

    await expect(page.getByLabel('Browse bar object name')).toHaveText('Test Condition Widget');
    const label = page.getByLabel('Test Condition Widget Object View');

    // The condition set keeps producing new output, so the label must keep tracking it through a
    // full sine wave cycle. `waitForFormattedTelemetryValue` subscribes to the condition set directly,
    // the same unfiltered path that drives conditional styling, so if it resolves while the assertion
    // on the label times out, the widget's styling and its text have diverged.
    for (const expectedValue of ['> 0', '< 0', '> 0']) {
      await waitForFormattedTelemetryValue({
        page,
        identifier: conditionSetIdentifier,
        expectedValue
      });
      await expect(label.getByText(expectedValue)).toBeVisible();
    }
  });

  test('Keeps updating the label after switching to fixed time mode with a future end bound', async ({
    page
  }) => {
    const conditionSetIdentifier = {
      namespace: '',
      key: conditionSet.uuid
    };

    await expect(page.getByLabel('Browse bar object name')).toHaveText('Test Condition Widget');
    const label = page.getByLabel('Test Condition Widget Object View');

    // Bring the realtime end offset down to a second. A widget that keeps filtering telemetry against
    // the bounds it held before the mode switch then goes stale within a second of the switch, rather
    // than after the thirty second default offset.
    await setEndOffset(page, { endHours: '00', endMins: '00', endSecs: '01' });

    // Confirm the label is tracking the condition set before the mode switch.
    await waitForFormattedTelemetryValue({
      page,
      identifier: conditionSetIdentifier,
      expectedValue: '> 0'
    });
    await expect(label.getByText('> 0')).toBeVisible();

    // Switch to fixed time mode while the widget stays mounted, with an end bound an hour in the
    // future so that incoming realtime telemetry still falls within the bounds of the time conductor.
    // This is the same call the URL time settings synchronizer makes when a user follows a link or
    // uses the browser's back and forward buttons.
    await page.evaluate(() => {
      const now = Date.now();
      window.openmct.time.setMode('fixed', {
        start: now - 60 * 60 * 1000,
        end: now + 60 * 60 * 1000
      });
    });
    await expect(
      page.getByRole('button', { name: 'Time Conductor Mode', exact: true })
    ).toContainText('Fixed Timespan');

    // The condition set keeps producing new output, so the label must keep tracking it through a full
    // sine wave cycle. `waitForFormattedTelemetryValue` subscribes to the condition set directly, the
    // same unfiltered path that drives conditional styling, so if it resolves while the assertion on
    // the label times out, the widget's styling and its text have diverged.
    for (const expectedValue of ['< 0', '> 0', '< 0']) {
      await waitForFormattedTelemetryValue({
        page,
        identifier: conditionSetIdentifier,
        expectedValue
      });
      await expect(label.getByText(expectedValue)).toBeVisible();
    }
  });
});

test.describe('A Condition Widget driven by a condition set with several inputs', () => {
  test('Keeps its label in step with the latest condition set result', async ({ page }) => {
    test.setTimeout(180 * 1000);
    await page.goto('./', { waitUntil: 'domcontentloaded' });

    // A state generator floors its timestamps to its own state duration, so these two generators
    // produce interleaved timestamps even though each is individually in order.
    const fastGenerator = await createDomainObjectWithDefaults(
      page,
      { type: 'State Generator', name: 'Fast Generator' },
      { duration: '1' }
    );
    const slowGenerator = await createDomainObjectWithDefaults(
      page,
      { type: 'State Generator', name: 'Slow Generator' },
      { duration: '10' }
    );
    const conditionSet = await createDomainObjectWithDefaults(page, {
      type: 'Condition Set',
      name: 'Multi Input Condition Set'
    });
    const conditionWidget = await createDomainObjectWithDefaults(page, {
      type: 'Condition Widget',
      name: 'Multi Input Condition Widget'
    });

    await setRealTimeMode(page);

    await page.goto(conditionSet.url);
    await page.getByLabel('Show selected item in tree').click();
    for (const generatorName of [fastGenerator.name, slowGenerator.name]) {
      await page
        .getByRole('tree', { name: 'Main Tree' })
        .getByRole('treeitem', { name: generatorName })
        .dragTo(page.locator('#conditionCollection'));
    }

    // Condition 1: the slow generator is ON.
    await page.getByLabel('Add Condition').click();
    await page.getByLabel('Condition Name Input').first().fill('SLOW ON');
    await page
      .getByLabel('Criterion Telemetry Selection')
      .first()
      .selectOption({ label: `/My Items/${slowGenerator.name}` });
    await page.getByLabel('Criterion Metadata Selection').first().selectOption({ value: 'state' });
    await page
      .getByLabel('Criterion Comparison Selection')
      .first()
      .selectOption({ value: 'enumValueIs' });
    await page.getByLabel('Criterion Else Selection').first().selectOption({ value: '1' });
    await page.getByLabel('Condition Output Type').first().selectOption({ value: 'string' });
    await page.getByLabel('Condition Output String').first().fill('SLOW ON');

    // Condition 2: the fast generator is ON. This keeps the fast generator's telemetry in use so that
    // it continues to drive evaluation and carry the result timestamps forward.
    await page.getByLabel('Add Condition').click();
    await page.getByLabel('Condition Name Input').first().fill('FAST ON');
    await page
      .getByLabel('Criterion Telemetry Selection')
      .first()
      .selectOption({ label: `/My Items/${fastGenerator.name}` });
    await page.getByLabel('Criterion Metadata Selection').first().selectOption({ value: 'state' });
    await page
      .getByLabel('Criterion Comparison Selection')
      .first()
      .selectOption({ value: 'enumValueIs' });
    await page.getByLabel('Criterion Else Selection').first().selectOption({ value: '1' });
    await page.getByLabel('Condition Output Type').first().selectOption({ value: 'string' });
    await page.getByLabel('Condition Output String').first().fill('FAST ON');

    await page.getByLabel('Save').click();
    await page.getByRole('listitem', { name: 'Save and Finish Editing' }).click();

    await page.goto(conditionWidget.url);
    await page.getByLabel('Edit Object').click();
    await page.getByRole('button', { name: 'Use Conditional Styling...' }).click();
    const overlay = page.getByLabel('Modal Overlay');
    await overlay.getByLabel('Search Input').fill(conditionSet.name);
    await overlay.getByLabel(`Preview ${conditionSet.name}`).click();
    await overlay.getByLabel('Save').click();
    // Something about the way we have implemented toggles does not sit right with
    // Playwright and we cannot use either .click() or .check() here.
    await page.getByLabel('Use Condition Set output as label').dispatchEvent('click');
    await page.getByRole('button', { name: 'Save' }).click();
    await page.getByRole('listitem', { name: 'Save and Finish Editing' }).click();

    //Refresh to get the updated object configuration
    await page.reload();
    await expect(page.getByLabel('Browse bar object name')).toHaveText(conditionWidget.name);

    // Subscribe to the condition set directly. That is the unfiltered stream that also drives the
    // widget's conditional styling, so a label that falls out of step with it is a label that
    // disagrees with the widget's own styling.
    const staleReadings = await page.evaluate(async (uuid) => {
      const openmct = window.openmct;
      const conditionSetObject = await openmct.objects.get({ namespace: '', key: uuid });
      const readings = [];
      let latestOutput = null;
      let latestOutputAt = 0;

      const unsubscribe = openmct.telemetry.subscribe(conditionSetObject, (datum) => {
        latestOutput = datum.output;
        latestOutputAt = Date.now();
      });

      await new Promise((resolve) => {
        const poll = setInterval(() => {
          const labelElement = document.querySelector('.c-condition-widget__label');

          // Only judge the label once the most recent result has had time to render, so that the
          // moment between a result arriving and the label updating is not mistaken for staleness.
          const hasSettled = latestOutput !== null && Date.now() - latestOutputAt > 400;

          if (labelElement !== null && hasSettled) {
            const label = labelElement.textContent.trim();

            if (label !== latestOutput) {
              readings.push({ label, latestOutput });
            }
          }
        }, 100);

        setTimeout(() => {
          clearInterval(poll);
          resolve();
        }, 30000);
      });

      unsubscribe();

      return readings;
    }, conditionSet.uuid);

    expect(staleReadings).toEqual([]);
  });
});
