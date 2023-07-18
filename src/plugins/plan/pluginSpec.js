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

import { createOpenMct, resetApplicationState } from 'utils/testing';
import PlanPlugin from '../plan/plugin';
import Vue from 'vue';
import Properties from '../inspectorViews/properties/Properties.vue';

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

  describe('the plan view displays activities', () => {
    let planDomainObject;
    let mockObjectPath = [
      {
        identifier: {
          key: 'test',
          namespace: ''
        },
        type: 'time-strip',
        name: 'Test Parent Object'
      }
    ];
    let planView;

    beforeEach(() => {
      openmct.time.timeSystem('utc', {
        start: 1597160002854,
        end: 1597181232854
      });

      planDomainObject = {
        identifier: {
          key: 'test-object',
          namespace: ''
        },
        type: 'plan',
        id: 'test-object',
        selectFile: {
          body: JSON.stringify({
            'TEST-GROUP': [
              {
                name: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua',
                start: 1597170002854,
                end: 1597171032854,
                type: 'TEST-GROUP',
                color: 'fuchsia',
                textColor: 'black'
              },
              {
                name: 'Sed ut perspiciatis',
                start: 1597171132854,
                end: 1597171232854,
                type: 'TEST-GROUP',
                color: 'fuchsia',
                textColor: 'black'
              }
            ]
          })
        }
      };

      openmct.router.path = [planDomainObject];

      const applicableViews = openmct.objectViews.get(planDomainObject, [planDomainObject]);
      planView = applicableViews.find((viewProvider) => viewProvider.key === 'plan.view');
      let view = planView.view(planDomainObject, mockObjectPath);
      view.show(child, true);

      return Vue.nextTick();
    });

    it('loads activities into the view', () => {
      const svgEls = element.querySelectorAll('.c-plan__contents svg');
      expect(svgEls.length).toEqual(1);
    });

    it('displays the group label', () => {
      const labelEl = element.querySelector(
        '.c-plan__contents .c-object-label .c-object-label__name'
      );
      expect(labelEl.innerHTML).toMatch(/TEST-GROUP/);
    });

    it('displays the activities and their labels', async () => {
      const bounds = {
        start: 1597160002854,
        end: 1597181232854
      };

      openmct.time.bounds(bounds);

      await Vue.nextTick();
      const rectEls = element.querySelectorAll('.c-plan__contents use');
      expect(rectEls.length).toEqual(2);
      const textEls = element.querySelectorAll('.c-plan__contents text');
      expect(textEls.length).toEqual(3);
    });

    it('shows the status indicator when available', async () => {
      openmct.status.set(
        {
          key: 'test-object',
          namespace: ''
        },
        'draft'
      );

      await Vue.nextTick();
      const statusEl = element.querySelector('.c-plan__contents .is-status--draft');
      expect(statusEl).toBeDefined();
    });
  });

  describe('the plan version', () => {
    let component;
    let componentObject;
    let testPlanObject = {
      name: 'Plan',
      type: 'plan',
      identifier: {
        key: 'test-plan',
        namespace: ''
      },
      created: 123456789,
      modified: 123456790,
      version: 'v1'
    };

    beforeEach(async () => {
      openmct.selection.select(
        [
          {
            element: element,
            context: {
              item: testPlanObject
            }
          },
          {
            element: openmct.layout.$refs.browseObject.$el,
            context: {
              item: testPlanObject,
              supportsMultiSelect: false
            }
          }
        ],
        false
      );

      await Vue.nextTick();
      let viewContainer = document.createElement('div');
      child.append(viewContainer);
      component = new Vue({
        el: viewContainer,
        components: {
          Properties
        },
        provide: {
          openmct: openmct
        },
        template: '<properties/>'
      });
    });

    afterEach(() => {
      component.$destroy();
    });

    it('provides an inspector view with the version information if available', () => {
      componentObject = component.$root.$children[0];
      const propertiesEls = componentObject.$el.querySelectorAll('.c-inspect-properties__row');
      const found = Array.from(propertiesEls).some((propertyEl) => {
        return (
          propertyEl.children[0].innerHTML.trim() === 'Version' &&
          propertyEl.children[1].innerHTML.trim() === 'v1'
        );
      });
      expect(found).toBeTrue();
    });
  });
});
