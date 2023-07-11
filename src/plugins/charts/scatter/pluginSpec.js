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
import Vue from 'vue';
import ScatterPlotPlugin from './plugin';
import ScatterPlot from './ScatterPlotView.vue';
import EventEmitter from 'EventEmitter';
import { SCATTER_PLOT_VIEW, SCATTER_PLOT_KEY } from './scatterPlotConstants';

describe('the plugin', function () {
  let element;
  let child;
  let openmct;
  let telemetryPromise;
  let telemetryPromiseResolve;
  let mockObjectPath;

  beforeEach((done) => {
    mockObjectPath = [
      {
        name: 'mock folder',
        type: 'fake-folder',
        identifier: {
          key: 'mock-folder',
          namespace: ''
        }
      }
    ];
    const testTelemetry = [
      {
        utc: 1,
        'some-key': 'some-value 1',
        'some-other-key': 'some-other-value 1'
      },
      {
        utc: 2,
        'some-key': 'some-value 2',
        'some-other-key': 'some-other-value 2'
      },
      {
        utc: 3,
        'some-key': 'some-value 3',
        'some-other-key': 'some-other-value 3'
      }
    ];

    openmct = createOpenMct();

    telemetryPromise = new Promise((resolve) => {
      telemetryPromiseResolve = resolve;
    });

    spyOn(openmct.telemetry, 'request').and.callFake(() => {
      telemetryPromiseResolve(testTelemetry);

      return telemetryPromise;
    });

    openmct.install(new ScatterPlotPlugin());

    element = document.createElement('div');
    element.style.width = '640px';
    element.style.height = '480px';
    child = document.createElement('div');
    child.style.width = '640px';
    child.style.height = '480px';
    element.appendChild(child);
    document.body.appendChild(element);

    spyOn(window, 'ResizeObserver').and.returnValue({
      observe() {},
      unobserve() {},
      disconnect() {}
    });

    openmct.time.timeSystem('utc', {
      start: 0,
      end: 4
    });

    openmct.types.addType('test-object', {
      creatable: true
    });

    openmct.on('start', done);
    openmct.startHeadless();
  });

  afterEach((done) => {
    openmct.time.timeSystem('utc', {
      start: 0,
      end: 1
    });
    resetApplicationState(openmct).then(done).catch(done);
  });

  describe('The scatter plot view', () => {
    let testDomainObject;
    let scatterPlotObject;
    // eslint-disable-next-line no-unused-vars
    let component;
    let mockComposition;

    beforeEach(async () => {
      scatterPlotObject = {
        identifier: {
          namespace: '',
          key: 'test-plot'
        },
        type: 'telemetry.plot.scatter-plot',
        name: 'Test Scatter Plot',
        configuration: {
          axes: {},
          styles: {}
        }
      };

      testDomainObject = {
        identifier: {
          namespace: '',
          key: 'test-object'
        },
        type: 'test-object',
        name: 'Test Object',
        telemetry: {
          values: [
            {
              key: 'utc',
              format: 'utc',
              name: 'Time',
              hints: {
                domain: 1
              }
            },
            {
              key: 'some-key',
              name: 'Some attribute',
              hints: {
                range: 1
              }
            },
            {
              key: 'some-other-key',
              name: 'Another attribute',
              hints: {
                range: 2
              }
            }
          ]
        }
      };

      mockComposition = new EventEmitter();
      mockComposition.load = () => {
        mockComposition.emit('add', testDomainObject);

        return [testDomainObject];
      };

      spyOn(openmct.composition, 'get').and.returnValue(mockComposition);

      let viewContainer = document.createElement('div');
      child.append(viewContainer);
      component = new Vue({
        el: viewContainer,
        components: {
          ScatterPlot
        },
        provide: {
          openmct: openmct,
          domainObject: scatterPlotObject,
          composition: openmct.composition.get(scatterPlotObject)
        },
        template: '<ScatterPlot></ScatterPlot>'
      });

      await Vue.nextTick();
    });

    it('provides a scatter plot view', () => {
      const applicableViews = openmct.objectViews.get(scatterPlotObject, mockObjectPath);
      const plotViewProvider = applicableViews.find(
        (viewProvider) => viewProvider.key === SCATTER_PLOT_VIEW
      );
      expect(plotViewProvider).toBeDefined();
    });

    it('Renders plotly scatter plot', () => {
      let scatterPlotElement = element.querySelectorAll('.plotly');
      expect(scatterPlotElement.length).toBe(1);
    });
  });

  describe('the scatter plot objects', () => {
    const mockObject = {
      name: 'A very nice scatter plot',
      key: SCATTER_PLOT_KEY,
      creatable: true
    };

    it('defines a scatter plot object type with the correct key', () => {
      const objectDef = openmct.types.get(SCATTER_PLOT_KEY).definition;
      expect(objectDef.key).toEqual(mockObject.key);
    });

    it('is creatable', () => {
      const objectDef = openmct.types.get(SCATTER_PLOT_KEY).definition;
      expect(objectDef.creatable).toEqual(mockObject.creatable);
    });
  });

  describe('The scatter plot composition policy', () => {
    it('allows composition for telemetry that contain at least 2 ranges', () => {
      const parent = {
        composition: [],
        configuration: {
          axes: {},
          styles: {}
        },
        name: 'Some Scatter Plot',
        type: 'telemetry.plot.scatter-plot',
        location: 'mine',
        modified: 1631005183584,
        persisted: 1631005183502,
        identifier: {
          namespace: '',
          key: 'b78e7e23-f2b8-4776-b1f0-3ff778f5c8a9'
        }
      };
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
            },
            {
              key: 'some-other-key2',
              name: 'Another attribute2',
              hints: {
                range: 2
              }
            }
          ]
        }
      };
      const composition = openmct.composition.get(parent);
      expect(() => {
        composition.add(testTelemetryObject);
      }).not.toThrow();
      expect(parent.composition.length).toBe(1);
    });

    it("disallows composition for telemetry that don't contain at least 2 range hints", () => {
      const parent = {
        composition: [],
        configuration: {
          axes: {},
          styles: {}
        },
        name: 'Some Scatter Plot',
        type: 'telemetry.plot.scatter-plot',
        location: 'mine',
        modified: 1631005183584,
        persisted: 1631005183502,
        identifier: {
          namespace: '',
          key: 'b78e7e23-f2b8-4776-b1f0-3ff778f5c8a9'
        }
      };
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
      const composition = openmct.composition.get(parent);
      expect(() => {
        composition.add(testTelemetryObject);
      }).toThrow();
      expect(parent.composition.length).toBe(0);
    });
  });
  describe('the inspector view', () => {
    let mockComposition;
    let testDomainObject;
    let selection;
    let plotInspectorView;
    let viewContainer;
    let optionsElement;
    beforeEach(async () => {
      testDomainObject = {
        identifier: {
          namespace: '',
          key: 'test-object'
        },
        type: 'test-object',
        name: 'Test Object',
        telemetry: {
          values: [
            {
              key: 'utc',
              format: 'utc',
              name: 'Time',
              hints: {
                domain: 1
              }
            },
            {
              key: 'some-key',
              name: 'Some attribute',
              hints: {
                range: 1
              }
            },
            {
              key: 'some-other-key',
              name: 'Another attribute',
              hints: {
                range: 2
              }
            }
          ]
        }
      };

      selection = [
        [
          {
            context: {
              item: {
                id: 'test-object',
                identifier: {
                  key: 'test-object',
                  namespace: ''
                },
                type: 'telemetry.plot.scatter-plot',
                configuration: {
                  axes: {},
                  styles: {}
                },
                composition: [
                  {
                    key: '~Some~foo.scatter'
                  }
                ]
              }
            }
          }
        ]
      ];

      mockComposition = new EventEmitter();
      mockComposition.load = () => {
        mockComposition.emit('add', testDomainObject);

        return [testDomainObject];
      };

      spyOn(openmct.composition, 'get').and.returnValue(mockComposition);

      viewContainer = document.createElement('div');
      child.append(viewContainer);

      const applicableViews = openmct.inspectorViews.get(selection);
      plotInspectorView = applicableViews[0];
      plotInspectorView.show(viewContainer);

      await Vue.nextTick();
      optionsElement = element.querySelector('.c-scatter-plot-options');
    });

    afterEach(() => {
      plotInspectorView.destroy();
    });

    it('it renders the options', () => {
      expect(optionsElement).toBeDefined();
    });
  });
});
