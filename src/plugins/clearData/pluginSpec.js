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

import ClearDataPlugin from './plugin.js';
import Vue from 'vue';
import { createOpenMct, resetApplicationState, createMouseEvent } from 'utils/testing';

describe('The Clear Data Plugin:', () => {
  let clearDataPlugin;

  describe('The clear data action:', () => {
    let openmct;
    let selection;
    let mockObjectPath;
    let clearDataAction;
    let testViewObject;
    beforeEach((done) => {
      openmct = createOpenMct();

      clearDataPlugin = new ClearDataPlugin(
        ['table', 'telemetry.plot.overlay', 'telemetry.plot.stacked'],
        { indicator: true }
      );
      openmct.install(clearDataPlugin);

      clearDataAction = openmct.actions.getAction('clear-data-action');
      testViewObject = [
        {
          identifier: {
            key: 'foo-table',
            namespace: ''
          },
          type: 'table'
        }
      ];
      openmct.router.path = testViewObject;
      mockObjectPath = [
        {
          name: 'Mock Table',
          type: 'table',
          identifier: {
            key: 'foo-table',
            namespace: ''
          }
        }
      ];
      selection = [
        {
          context: {
            item: mockObjectPath[0]
          }
        }
      ];

      openmct.selection.select(selection);

      openmct.on('start', done);
      openmct.startHeadless();
    });

    afterEach(() => {
      openmct.router.path = null;

      return resetApplicationState(openmct);
    });
    it('is installed', () => {
      expect(clearDataAction).toBeDefined();
    });

    it('is applicable on applicable objects', () => {
      const gatheredActions = openmct.actions.getActionsCollection(mockObjectPath);
      expect(gatheredActions.applicableActions['clear-data-action']).toBeDefined();
    });

    it('is not applicable on inapplicable objects', () => {
      testViewObject = [
        {
          identifier: {
            key: 'foo-widget',
            namespace: ''
          },
          type: 'widget'
        }
      ];
      mockObjectPath = [
        {
          name: 'Mock Widget',
          type: 'widget',
          identifier: {
            key: 'foo-widget',
            namespace: ''
          }
        }
      ];
      selection = [
        {
          context: {
            item: mockObjectPath[0]
          }
        }
      ];
      openmct.selection.select(selection);
      const gatheredActions = openmct.actions.getActionsCollection(mockObjectPath);
      expect(gatheredActions.applicableActions['clear-data-action']).toBeUndefined();
    });

    it('is not applicable if object not in the selection path and not a layout', () => {
      selection = [
        {
          context: {
            item: {
              name: 'Some Random Widget',
              type: 'not-in-path-widget',
              identifier: {
                key: 'something-else-widget',
                namespace: ''
              }
            }
          }
        }
      ];
      openmct.selection.select(selection);
      const gatheredActions = openmct.actions.getActionsCollection(mockObjectPath);
      expect(gatheredActions.applicableActions['clear-data-action']).toBeUndefined();
    });

    it('is applicable if object not in the selection path and is a layout', () => {
      selection = [
        {
          context: {
            item: {
              name: 'Some Random Widget',
              type: 'not-in-path-widget',
              identifier: {
                key: 'something-else-widget',
                namespace: ''
              }
            }
          }
        }
      ];

      openmct.selection.select(selection);

      testViewObject = [
        {
          identifier: {
            key: 'foo-layout',
            namespace: ''
          },
          type: 'layout'
        }
      ];
      openmct.router.path = testViewObject;
      const gatheredActions = openmct.actions.getActionsCollection(mockObjectPath);
      expect(gatheredActions.applicableActions['clear-data-action']).toBeDefined();
    });

    it('fires an event upon invocation', (done) => {
      openmct.objectViews.on('clearData', (domainObject) => {
        expect(domainObject).toEqual(testViewObject[0]);
        done();
      });
      clearDataAction.invoke(testViewObject);
    });
  });

  describe('The clear data indicator:', () => {
    let openmct;
    let appHolder;

    beforeEach((done) => {
      openmct = createOpenMct();

      clearDataPlugin = new ClearDataPlugin(
        ['table', 'telemetry.plot.overlay', 'telemetry.plot.stacked', 'example.imagery'],
        {
          indicator: true
        }
      );
      openmct.install(clearDataPlugin);
      appHolder = document.createElement('div');
      document.body.appendChild(appHolder);
      openmct.on('start', done);
      openmct.start(appHolder);
    });

    it('installs', () => {
      const globalClearIndicator = openmct.indicators.indicatorObjects.find(
        (indicator) => indicator.key === 'global-clear-indicator'
      ).element;
      expect(globalClearIndicator).toBeDefined();
    });

    it('renders its major elements', async () => {
      await Vue.nextTick();
      const indicatorClass = appHolder.querySelector('.c-indicator');
      const iconClass = appHolder.querySelector('.icon-clear-data');
      const indicatorLabel = appHolder.querySelector('.c-indicator__label');
      const buttonElement = indicatorLabel.querySelector('button');
      const hasMajorElements = Boolean(indicatorClass && iconClass && buttonElement);

      expect(hasMajorElements).toBe(true);
      expect(buttonElement.innerText).toEqual('Clear Data');
    });

    it('clicking the button fires the global clear', (done) => {
      const indicatorLabel = appHolder.querySelector('.c-indicator__label');
      const buttonElement = indicatorLabel.querySelector('button');
      const clickEvent = createMouseEvent('click');
      openmct.objectViews.on('clearData', () => {
        // when we click the button, this event should fire
        done();
      });
      buttonElement.dispatchEvent(clickEvent);
    });
  });
});
