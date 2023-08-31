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
import TimelistPlugin from './plugin';
import { TIMELIST_TYPE } from './constants';
import Vue from 'vue';
import EventEmitter from 'EventEmitter';
import { FIXED_MODE_KEY } from '../../api/time/constants';

const TIME_FORMAT = 'YYYY-MM-DD HH:mm:ss';

const LIST_ITEM_CLASS = '.js-table__body .js-list-item';
const LIST_ITEM_VALUE_CLASS = '.js-list-item__value';
const LIST_ITEM_BODY_CLASS = '.js-table__body th';

xdescribe('the plugin', function () {
  let timelistDefinition;
  let element;
  let child;
  let openmct;
  let appHolder;
  let originalRouterPath;
  let mockComposition;
  let now = Date.now();
  let twoHoursPast = now - 1000 * 60 * 60 * 2;
  let oneHourPast = now - 1000 * 60 * 60;
  let twoHoursFuture = now + 1000 * 60 * 60 * 2;
  let planObject = {
    identifier: {
      key: 'test-plan-object',
      namespace: ''
    },
    type: 'plan',
    id: 'test-plan-object',
    selectFile: {
      body: JSON.stringify({
        'TEST-GROUP': [
          {
            name: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua',
            start: twoHoursPast,
            end: oneHourPast,
            type: 'TEST-GROUP',
            color: 'fuchsia',
            textColor: 'black'
          },
          {
            name: 'Sed ut perspiciatis',
            start: now,
            end: twoHoursFuture,
            type: 'TEST-GROUP',
            color: 'fuchsia',
            textColor: 'black'
          }
        ]
      })
    }
  };

  beforeEach((done) => {
    appHolder = document.createElement('div');
    appHolder.style.width = '640px';
    appHolder.style.height = '480px';

    openmct = createOpenMct({
      timeSystemKey: 'utc',
      bounds: {
        start: twoHoursPast,
        end: twoHoursFuture
      }
    });
    openmct.time.setMode(FIXED_MODE_KEY, {
      start: twoHoursPast,
      end: twoHoursFuture
    });
    openmct.install(new TimelistPlugin());

    timelistDefinition = openmct.types.get(TIMELIST_TYPE).definition;

    element = document.createElement('div');
    element.style.width = '640px';
    element.style.height = '480px';
    child = document.createElement('div');
    child.style.width = '640px';
    child.style.height = '480px';
    element.appendChild(child);

    originalRouterPath = openmct.router.path;

    mockComposition = new EventEmitter();
    // eslint-disable-next-line require-await
    mockComposition.load = async () => {
      return [planObject];
    };

    spyOn(openmct.composition, 'get').and.returnValue(mockComposition);
    openmct.on('start', done);
    openmct.start(appHolder);
  });

  afterEach(() => {
    openmct.router.path = originalRouterPath;

    return resetApplicationState(openmct);
  });

  let mockTimelistObject = {
    name: 'Timelist',
    key: TIMELIST_TYPE,
    creatable: true
  };

  it('defines a timelist object type with the correct key', () => {
    expect(timelistDefinition.key).toEqual(mockTimelistObject.key);
  });

  it('is creatable', () => {
    expect(timelistDefinition.creatable).toEqual(mockTimelistObject.creatable);
  });

  describe('the timelist view', () => {
    it('provides a timelist view', () => {
      const testViewObject = {
        id: 'test-object',
        type: TIMELIST_TYPE
      };
      openmct.router.path = [testViewObject];

      const applicableViews = openmct.objectViews.get(testViewObject, [testViewObject]);
      let timelistView = applicableViews.find(
        (viewProvider) => viewProvider.key === 'timelist.view'
      );
      expect(timelistView).toBeDefined();
    });
  });

  describe('the timelist view displays activities', () => {
    let timelistDomainObject;
    let timelistView;

    beforeEach(() => {
      timelistDomainObject = {
        identifier: {
          key: 'test-object',
          namespace: ''
        },
        type: TIMELIST_TYPE,
        id: 'test-object',
        configuration: {
          sortOrderIndex: 0,
          futureEventsIndex: 1,
          futureEventsDurationIndex: 0,
          futureEventsDuration: 0,
          currentEventsIndex: 1,
          currentEventsDurationIndex: 0,
          currentEventsDuration: 0,
          pastEventsIndex: 1,
          pastEventsDurationIndex: 0,
          pastEventsDuration: 0,
          filter: ''
        },
        selectFile: {
          body: JSON.stringify({
            'TEST-GROUP': [
              {
                name: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua',
                start: twoHoursPast,
                end: oneHourPast,
                type: 'TEST-GROUP',
                color: 'fuchsia',
                textColor: 'black'
              },
              {
                name: 'Sed ut perspiciatis',
                start: now,
                end: twoHoursFuture,
                type: 'TEST-GROUP',
                color: 'fuchsia',
                textColor: 'black'
              }
            ]
          })
        }
      };

      openmct.router.path = [timelistDomainObject];

      const applicableViews = openmct.objectViews.get(timelistDomainObject, [timelistDomainObject]);
      timelistView = applicableViews.find((viewProvider) => viewProvider.key === 'timelist.view');
      let view = timelistView.view(timelistDomainObject, []);
      view.show(child, true);

      return Vue.nextTick();
    });

    it('displays the activities', () => {
      const items = element.querySelectorAll(LIST_ITEM_CLASS);
      expect(items.length).toEqual(2);
    });

    it('displays the activity headers', () => {
      const headers = element.querySelectorAll(LIST_ITEM_BODY_CLASS);
      expect(headers.length).toEqual(4);
    });

    it('displays activity details', (done) => {
      const timeFormat = openmct.time.timeSystem().timeFormat;
      const timeFormatter = openmct.telemetry.getValueFormatter({ format: timeFormat }).formatter;
      Vue.nextTick(() => {
        const itemEls = element.querySelectorAll(LIST_ITEM_CLASS);
        const itemValues = itemEls[0].querySelectorAll(LIST_ITEM_VALUE_CLASS);
        expect(itemValues.length).toEqual(4);
        expect(itemValues[3].innerHTML.trim()).toEqual(
          'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua'
        );
        expect(itemValues[0].innerHTML.trim()).toEqual(
          timeFormatter.format(twoHoursPast, TIME_FORMAT)
        );
        expect(itemValues[1].innerHTML.trim()).toEqual(
          timeFormatter.format(oneHourPast, TIME_FORMAT)
        );

        done();
      });
    });
  });

  describe('the timelist composition', () => {
    let timelistDomainObject;
    let timelistView;

    beforeEach(() => {
      timelistDomainObject = {
        identifier: {
          key: 'test-object',
          namespace: ''
        },
        type: TIMELIST_TYPE,
        id: 'test-object',
        configuration: {
          sortOrderIndex: 0,
          futureEventsIndex: 1,
          futureEventsDurationIndex: 0,
          futureEventsDuration: 0,
          currentEventsIndex: 1,
          currentEventsDurationIndex: 0,
          currentEventsDuration: 0,
          pastEventsIndex: 1,
          pastEventsDurationIndex: 0,
          pastEventsDuration: 0,
          filter: ''
        },
        composition: [
          {
            identifier: {
              key: 'test-plan-object',
              namespace: ''
            }
          }
        ]
      };

      openmct.router.path = [timelistDomainObject];

      const applicableViews = openmct.objectViews.get(timelistDomainObject, [timelistDomainObject]);
      timelistView = applicableViews.find((viewProvider) => viewProvider.key === 'timelist.view');
      let view = timelistView.view(timelistDomainObject, [timelistDomainObject]);
      view.show(child, true);

      return Vue.nextTick();
    });

    it('loads the plan from composition', () => {
      mockComposition.emit('add', planObject);

      return Vue.nextTick(() => {
        const items = element.querySelectorAll(LIST_ITEM_CLASS);
        expect(items.length).toEqual(2);
      });
    });
  });

  describe('filters', () => {
    let timelistDomainObject;
    let timelistView;

    beforeEach(() => {
      timelistDomainObject = {
        identifier: {
          key: 'test-object',
          namespace: ''
        },
        type: TIMELIST_TYPE,
        id: 'test-object',
        configuration: {
          sortOrderIndex: 0,
          futureEventsIndex: 1,
          futureEventsDurationIndex: 0,
          futureEventsDuration: 0,
          currentEventsIndex: 1,
          currentEventsDurationIndex: 0,
          currentEventsDuration: 0,
          pastEventsIndex: 1,
          pastEventsDurationIndex: 0,
          pastEventsDuration: 0,
          filter: 'perspiciatis'
        },
        composition: [
          {
            identifier: {
              key: 'test-plan-object',
              namespace: ''
            }
          }
        ]
      };

      openmct.router.path = [timelistDomainObject];

      const applicableViews = openmct.objectViews.get(timelistDomainObject, [timelistDomainObject]);
      timelistView = applicableViews.find((viewProvider) => viewProvider.key === 'timelist.view');
      let view = timelistView.view(timelistDomainObject, [timelistDomainObject]);
      view.show(child, true);

      return Vue.nextTick();
    });

    it('activities', () => {
      mockComposition.emit('add', planObject);

      return Vue.nextTick(() => {
        const items = element.querySelectorAll(LIST_ITEM_CLASS);
        expect(items.length).toEqual(1);
      });
    });
  });

  describe('time filtering - past', () => {
    let timelistDomainObject;
    let timelistView;

    beforeEach(() => {
      timelistDomainObject = {
        identifier: {
          key: 'test-object',
          namespace: ''
        },
        type: TIMELIST_TYPE,
        id: 'test-object',
        configuration: {
          sortOrderIndex: 0,
          futureEventsIndex: 1,
          futureEventsDurationIndex: 0,
          futureEventsDuration: 0,
          currentEventsIndex: 1,
          currentEventsDurationIndex: 0,
          currentEventsDuration: 0,
          pastEventsIndex: 0,
          pastEventsDurationIndex: 0,
          pastEventsDuration: 0,
          filter: ''
        },
        composition: [
          {
            identifier: {
              key: 'test-plan-object',
              namespace: ''
            }
          }
        ]
      };

      openmct.router.path = [timelistDomainObject];

      const applicableViews = openmct.objectViews.get(timelistDomainObject, [timelistDomainObject]);
      timelistView = applicableViews.find((viewProvider) => viewProvider.key === 'timelist.view');
      let view = timelistView.view(timelistDomainObject, [timelistDomainObject]);
      view.show(child, true);

      return Vue.nextTick();
    });

    it('hides past events', () => {
      mockComposition.emit('add', planObject);

      return Vue.nextTick(() => {
        const items = element.querySelectorAll(LIST_ITEM_CLASS);
        expect(items.length).toEqual(1);
      });
    });
  });
});
