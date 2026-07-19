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

import { createOpenMct, resetApplicationState } from 'utils/testing';

import PlanPlugin from '../plan/plugin.js';

describe('the plugin', function () {
  let planDefinition;
  let ganttDefinition;
  let element;
  let child;
  let openmct;
  let appHolder;
  let originalRouterPath;

  beforeEach((done) => {
    appHolder = document.createElement('div');
    appHolder.style.width = '640px';
    appHolder.style.height = '480px';

    const timeSystemOptions = {
      timeSystemKey: 'utc',
      bounds: {
        start: 1597160002854,
        end: 1597181232854
      }
    };

    openmct = createOpenMct(timeSystemOptions);
    openmct.install(new PlanPlugin());

    planDefinition = openmct.types.get('plan').definition;
    ganttDefinition = openmct.types.get('gantt-chart').definition;

    element = document.createElement('div');
    element.style.width = '640px';
    element.style.height = '480px';
    child = document.createElement('div');
    child.style.width = '640px';
    child.style.height = '480px';
    element.appendChild(child);

    originalRouterPath = openmct.router.path;

    openmct.on('start', done);
    openmct.start(appHolder);
  });

  afterEach(() => {
    openmct.router.path = originalRouterPath;

    return resetApplicationState(openmct);
  });

  let mockPlanObject = {
    name: 'Plan',
    key: 'plan',
    creatable: false
  };

  let mockGanttObject = {
    name: 'Gantt',
    key: 'gantt-chart',
    creatable: true
  };

  describe('the plan type', () => {
    it('defines a plan object type with the correct key', () => {
      expect(planDefinition.key).toEqual(mockPlanObject.key);
    });
    it('is not creatable', () => {
      expect(planDefinition.creatable).toEqual(mockPlanObject.creatable);
    });
  });
  describe('the gantt-chart type', () => {
    it('defines a gantt-chart object type with the correct key', () => {
      expect(ganttDefinition.key).toEqual(mockGanttObject.key);
    });
    it('is creatable', () => {
      expect(ganttDefinition.creatable).toEqual(mockGanttObject.creatable);
    });
  });

  describe('the plan view', () => {
    it('provides a plan view', () => {
      const testViewObject = {
        id: 'test-object',
        type: 'plan'
      };
      openmct.router.path = [testViewObject];

      const applicableViews = openmct.objectViews.get(testViewObject, [testViewObject]);
      let planView = applicableViews.find((viewProvider) => viewProvider.key === 'plan.view');
      expect(planView).toBeDefined();
    });

    it('is not an editable view', () => {
      const testViewObject = {
        id: 'test-object',
        type: 'plan'
      };
      openmct.router.path = [testViewObject];

      const applicableViews = openmct.objectViews.get(testViewObject, [testViewObject]);
      let planView = applicableViews.find((viewProvider) => viewProvider.key === 'plan.view');
      expect(planView.canEdit(testViewObject)).toBeFalse();
    });
  });
});
