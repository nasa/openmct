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
import { createOpenMct, resetApplicationState } from '../../utils/testing';
import SimpleIndicator from './SimpleIndicator';

describe('The Indicator API', () => {
  let openmct;

  beforeEach(() => {
    openmct = createOpenMct();
  });

  afterEach(() => {
    return resetApplicationState(openmct);
  });

  function generateIndicator(className, label, priority) {
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

  it('can register an indicator', () => {
    const testIndicator = generateIndicator('test-indicator', 'This is a test indicator', 2);
    openmct.indicators.add(testIndicator);
    expect(openmct.indicators.indicatorObjects).toBeDefined();
    // notifier indicator is installed by default
    expect(openmct.indicators.indicatorObjects.length).toBe(2);
  });

  it('can order indicators based on priority', () => {
    const testIndicator1 = generateIndicator(
      'test-indicator-1',
      'This is a test indicator',
      openmct.priority.LOW
    );
    openmct.indicators.add(testIndicator1);

    const testIndicator2 = generateIndicator(
      'test-indicator-2',
      'This is another test indicator',
      openmct.priority.DEFAULT
    );
    openmct.indicators.add(testIndicator2);

    const testIndicator3 = generateIndicator(
      'test-indicator-3',
      'This is yet another test indicator',
      openmct.priority.LOW
    );
    openmct.indicators.add(testIndicator3);

    const testIndicator4 = generateIndicator(
      'test-indicator-4',
      'This is yet another test indicator',
      openmct.priority.HIGH
    );
    openmct.indicators.add(testIndicator4);

    expect(openmct.indicators.indicatorObjects.length).toBe(5);
    const indicatorObjectsByPriority = openmct.indicators.getIndicatorObjectsByPriority();
    expect(indicatorObjectsByPriority.length).toBe(5);
    expect(indicatorObjectsByPriority[2].priority).toBe(openmct.priority.DEFAULT);
  });

  it('the simple indicator can be added', () => {
    const simpleIndicator = new SimpleIndicator(openmct);
    openmct.indicators.add(simpleIndicator);

    expect(openmct.indicators.indicatorObjects.length).toBe(2);
  });
});
