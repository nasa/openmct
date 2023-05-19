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

import { createOpenMct, resetApplicationState } from '@/utils/testing';
import TimelinePlugin from './plugin';
import Vue from 'vue';
import EventEmitter from 'EventEmitter';

describe('the plugin', function () {
  let objectDef;
  let appHolder;
  let element;
  let child;
  let openmct;
  let mockObjectPath;
  let mockCompositionForTimelist;
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
  let timelineObject = {
    composition: [],
    configuration: {
      useIndependentTime: false,
      timeOptions: {
        mode: {
          key: 'fixed'
        },
        fixedOffsets: {
          start: 10,
          end: 11
        },
        clockOffsets: {
          start: -(30 * 60 * 1000),
          end: 30 * 60 * 1000
        }
      }
    },
    name: 'Some timestrip',
    type: 'time-strip',
    location: 'mine',
    modified: 1631005183584,
    persisted: 1631005183502,
    identifier: {
      namespace: '',
      key: 'b78e7e23-f2b8-4776-b1f0-3ff778f5c8a9'
    }
  };

  beforeEach((done) => {
    appHolder = document.createElement('div');
    appHolder.style.width = '640px';
    appHolder.style.height = '480px';

    mockObjectPath = [
      {
        name: 'mock folder',
        type: 'fake-folder',
        identifier: {
          key: 'mock-folder',
          namespace: ''
        }
      },
      {
        name: 'mock parent folder',
        type: 'time-strip',
        identifier: {
          key: 'mock-parent-folder',
          namespace: ''
        }
      }
    ];

    const timeSystem = {
      timeSystemKey: 'utc',
      bounds: {
        start: 1597160002854,
        end: 1597181232854
      }
    };

    openmct = createOpenMct(timeSystem);
    openmct.install(new TimelinePlugin());

    objectDef = openmct.types.get('time-strip').definition;

    element = document.createElement('div');
    element.style.width = '640px';
    element.style.height = '480px';
    child = document.createElement('div');
    child.style.width = '640px';
    child.style.height = '480px';
    element.appendChild(child);

    openmct.on('start', done);
    openmct.start(appHolder);
  });

  afterEach(() => {
    return resetApplicationState(openmct);
  });

  let mockObject = {
    name: 'Time Strip',
    key: 'time-strip',
    creatable: true
  };

  it('defines a time-strip object type with the correct key', () => {
    expect(objectDef.key).toEqual(mockObject.key);
  });

  describe('the time-strip object', () => {
    it('is creatable', () => {
      expect(objectDef.creatable).toEqual(mockObject.creatable);
    });
  });

  describe('the view', () => {
    let timelineView;
    let testViewObject;

    beforeEach(() => {
      testViewObject = {
        ...timelineObject
      };

      const applicableViews = openmct.objectViews.get(testViewObject, mockObjectPath);
      timelineView = applicableViews.find((viewProvider) => viewProvider.key === 'time-strip.view');
      let view = timelineView.view(testViewObject, mockObjectPath);
      view.show(child, true);

      return Vue.nextTick();
    });

    it('provides a view', () => {
      expect(timelineView).toBeDefined();
    });

    it('displays a time axis', () => {
      const el = element.querySelector('.c-timesystem-axis');
      expect(el).toBeDefined();
    });

    it('does not show the independent time conductor based on configuration', () => {
      const independentTimeConductorEl = element.querySelector(
        '.c-timeline-holder > .c-conductor__controls'
      );
      expect(independentTimeConductorEl).toBeNull();
    });
  });

  describe('the timeline composition', () => {
    let timelineDomainObject;
    let timelineView;

    beforeEach(() => {
      timelineDomainObject = {
        ...timelineObject,
        composition: [
          {
            identifier: {
              key: 'test-plan-object',
              namespace: ''
            }
          }
        ]
      };

      mockCompositionForTimelist = new EventEmitter();
      mockCompositionForTimelist.load = () => {
        mockCompositionForTimelist.emit('add', planObject);

        return [planObject];
      };

      spyOn(openmct.composition, 'get')
        .withArgs(timelineDomainObject)
        .and.returnValue(mockCompositionForTimelist);

      openmct.router.path = [timelineDomainObject];

      const applicableViews = openmct.objectViews.get(timelineDomainObject, [timelineDomainObject]);
      timelineView = applicableViews.find((viewProvider) => viewProvider.key === 'time-strip.view');
      let view = timelineView.view(timelineDomainObject, [timelineDomainObject]);
      view.show(child, true);

      return Vue.nextTick();
    });

    it('loads the plan from composition', () => {
      return Vue.nextTick(() => {
        const items = element.querySelectorAll('.js-timeline__content');
        expect(items.length).toEqual(1);
      });
    });
  });

  describe('the independent time conductor', () => {
    let timelineView;
    let testViewObject = {
      ...timelineObject,
      configuration: {
        ...timelineObject.configuration,
        useIndependentTime: true
      }
    };

    beforeEach((done) => {
      const applicableViews = openmct.objectViews.get(testViewObject, mockObjectPath);
      timelineView = applicableViews.find((viewProvider) => viewProvider.key === 'time-strip.view');
      let view = timelineView.view(testViewObject, mockObjectPath);
      view.show(child, true);

      Vue.nextTick(done);
    });

    it('displays an independent time conductor with saved options - local clock', () => {
      return Vue.nextTick(() => {
        const independentTimeConductorEl = element.querySelector(
          '.c-timeline-holder > .c-conductor__controls'
        );
        expect(independentTimeConductorEl).toBeDefined();

        const independentTimeContext = openmct.time.getIndependentContext(
          testViewObject.identifier.key
        );
        expect(independentTimeContext.clockOffsets()).toEqual(
          testViewObject.configuration.timeOptions.clockOffsets
        );
      });
    });
  });

  describe('the independent time conductor - fixed', () => {
    let timelineView;
    let testViewObject2 = {
      ...timelineObject,
      id: 'test-object2',
      identifier: {
        key: 'test-object2',
        namespace: ''
      },
      configuration: {
        ...timelineObject.configuration,
        useIndependentTime: true
      }
    };

    beforeEach((done) => {
      const applicableViews = openmct.objectViews.get(testViewObject2, mockObjectPath);
      timelineView = applicableViews.find((viewProvider) => viewProvider.key === 'time-strip.view');
      let view = timelineView.view(testViewObject2, mockObjectPath);
      view.show(child, true);

      Vue.nextTick(done);
    });

    it('displays an independent time conductor with saved options - fixed timespan', () => {
      return Vue.nextTick(() => {
        const independentTimeConductorEl = element.querySelector(
          '.c-timeline-holder > .c-conductor__controls'
        );
        expect(independentTimeConductorEl).toBeDefined();

        const independentTimeContext = openmct.time.getIndependentContext(
          testViewObject2.identifier.key
        );
        expect(independentTimeContext.bounds()).toEqual(
          testViewObject2.configuration.timeOptions.fixedOffsets
        );
      });
    });
  });

  describe('The timestrip composition policy', () => {
    let testObject;
    beforeEach(() => {
      testObject = {
        ...timelineObject,
        composition: []
      };
    });

    it('allows composition for plots', () => {
      const testTelemetryObject = {
        identifier: {
          namespace: '',
          key: 'test-object'
        },
        type: 'test-object',
        name: 'Test Object',
        telemetry: {
          values: [
            {
              key: 'some-key',
              name: 'Some attribute',
              hints: {
                domain: 1
              }
            },
            {
              key: 'some-other-key',
              name: 'Another attribute',
              hints: {
                range: 1
              }
            }
          ]
        }
      };
      const composition = openmct.composition.get(testObject);
      expect(() => {
        composition.add(testTelemetryObject);
      }).not.toThrow();
      expect(testObject.composition.length).toBe(1);
    });

    it('allows composition for plans', () => {
      const composition = openmct.composition.get(testObject);
      expect(() => {
        composition.add(planObject);
      }).not.toThrow();
      expect(testObject.composition.length).toBe(1);
    });

    it('disallows composition for non time-based plots', () => {
      const barGraphObject = {
        identifier: {
          namespace: '',
          key: 'test-object'
        },
        type: 'telemetry.plot.bar-graph',
        name: 'Test Object'
      };
      const composition = openmct.composition.get(testObject);
      expect(() => {
        composition.add(barGraphObject);
      }).toThrow();
      expect(testObject.composition.length).toBe(0);
    });
  });
});
