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
import { defineComponent } from 'vue';

import { createOpenMct, resetApplicationState } from '../../utils/testing.js';
import SimpleIndicator from './SimpleIndicator.js';

describe('The Indicator API', () => {
  let openmct;

  beforeEach(() => {
    openmct = createOpenMct();
  });

  afterEach(() => {
    return resetApplicationState(openmct);
  });

  function generateHTMLIndicator(className, label, priority) {
    const element = document.createElement('div');
    element.classList.add(className);
    const textNode = document.createTextNode(label);
    element.appendChild(textNode);
    const testIndicator = {
      element,
      priority
    };

    return testIndicator;
  }

  function generateVueIndicator(priority) {
    return {
      vueComponent: defineComponent({
        template: '<div class="test-indicator">This is a test indicator</div>'
      }),
      priority
    };
  }

  it('can register an HTML indicator', () => {
    const testIndicator = generateHTMLIndicator('test-indicator', 'This is a test indicator', 2);
    openmct.indicators.add(testIndicator);
    expect(openmct.indicators.indicatorObjects).toBeDefined();
    // notifier indicator is installed by default
    expect(openmct.indicators.indicatorObjects.length).toBe(2);
  });

  it('can register a Vue indicator', () => {
    const testIndicator = generateVueIndicator(2);
    openmct.indicators.add(testIndicator);
    expect(openmct.indicators.indicatorObjects).toBeDefined();
    // notifier indicator is installed by default
    expect(openmct.indicators.indicatorObjects.length).toBe(2);
  });

  it('can order indicators based on priority', () => {
    const testIndicator1 = generateHTMLIndicator(
      'test-indicator-1',
      'This is a test indicator',
      openmct.priority.LOW
    );
    openmct.indicators.add(testIndicator1);

    const testIndicator2 = generateHTMLIndicator(
      'test-indicator-2',
      'This is another test indicator',
      openmct.priority.DEFAULT
    );
    openmct.indicators.add(testIndicator2);

    const testIndicator3 = generateHTMLIndicator(
      'test-indicator-3',
      'This is yet another test indicator',
      openmct.priority.LOW
    );
    openmct.indicators.add(testIndicator3);

    const testIndicator4 = generateHTMLIndicator(
      'test-indicator-4',
      'This is yet another test indicator',
      openmct.priority.HIGH
    );
    openmct.indicators.add(testIndicator4);

    const testIndicator5 = generateVueIndicator(openmct.priority.DEFAULT);
    openmct.indicators.add(testIndicator5);

    expect(openmct.indicators.indicatorObjects.length).toBe(6);
    const indicatorObjectsByPriority = openmct.indicators.getIndicatorObjectsByPriority();
    expect(indicatorObjectsByPriority.length).toBe(6);
    expect(indicatorObjectsByPriority[2].priority).toBe(openmct.priority.DEFAULT);
  });

  it('the simple indicator can be added', () => {
    const simpleIndicator = new SimpleIndicator(openmct);
    openmct.indicators.add(simpleIndicator);

    expect(openmct.indicators.indicatorObjects.length).toBe(2);
  });
});
