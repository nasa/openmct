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

import {
  createMouseEvent,
  createOpenMct,
  resetApplicationState,
  spyOnBuiltins
} from 'utils/testing';
import PlotVuePlugin from '../plugin';
import Vue from 'vue';
import Plot from '../Plot.vue';
import configStore from '../configuration/ConfigStore';
import EventEmitter from 'EventEmitter';
import PlotOptions from '../inspector/PlotOptions.vue';

describe('the plugin', function () {
  let element;
  let child;
  let openmct;
  let telemetryPromise;
  let telemetryPromiseResolve;
  let mockObjectPath;
  let overlayPlotObject = {
    identifier: {
      namespace: '',
      key: 'test-plot'
    },
    type: 'telemetry.plot.overlay',
    name: 'Test Overlay Plot',
    composition: [],
    configuration: {
      series: []
    }
  };

  beforeEach((done) => {
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
    const testTelemetry = [
      {
        utc: 1,
        'some-key': 'some-value 1',
        'some-other-key': 'some-other-value 1',
        'some-key2': 'some-value2 1',
        'some-other-key2': 'some-other-value2 1'
      },
      {
        utc: 2,
        'some-key': 'some-value 2',
        'some-other-key': 'some-other-value 2',
        'some-key2': 'some-value2 2',
        'some-other-key2': 'some-other-value2 2'
      },
      {
        utc: 3,
        'some-key': 'some-value 3',
        'some-other-key': 'some-other-value 3',
        'some-key2': 'some-value2 2',
        'some-other-key2': 'some-other-value2 2'
      }
    ];

    const timeSystem = {
      timeSystemKey: 'utc',
      bounds: {
        start: 0,
        end: 4
      }
    };

    openmct = createOpenMct(timeSystem);

    telemetryPromise = new Promise((resolve) => {
      telemetryPromiseResolve = resolve;
    });

    spyOn(openmct.telemetry, 'request').and.callFake(() => {
      telemetryPromiseResolve(testTelemetry);

      return telemetryPromise;
    });

    openmct.install(new PlotVuePlugin());

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

    openmct.types.addType('test-object', {
      creatable: true
    });

    spyOnBuiltins(['requestAnimationFrame']);
    window.requestAnimationFrame.and.callFake((callBack) => {
      callBack();
    });

    openmct.router.path = [overlayPlotObject];
    openmct.on('start', done);
    openmct.startHeadless();
  });

  afterEach((done) => {
    openmct.time.timeSystem('utc', {
      start: 0,
      end: 1
    });
    configStore.deleteAll();
    resetApplicationState(openmct).then(done).catch(done);
  });

  afterAll(() => {
    openmct.router.path = null;
  });

  describe('the plot views', () => {
    it('provides an overlay plot view for objects with telemetry', () => {
      const testTelemetryObject = {
        id: 'test-object',
        type: 'telemetry.plot.overlay',
        telemetry: {
          values: [
            {
              key: 'some-key'
            }
          ]
        }
      };

      const applicableViews = openmct.objectViews.get(testTelemetryObject, mockObjectPath);
      let plotView = applicableViews.find((viewProvider) => viewProvider.key === 'plot-overlay');
      expect(plotView).toBeDefined();
    });
  });

  describe('The overlay plot view with multiple axes', () => {
    let testTelemetryObject;
    let testTelemetryObject2;
    let config;
    let component;
    let mockComposition;

    afterAll(() => {
      component.$destroy();
      openmct.router.path = null;
    });

    beforeEach(() => {
      testTelemetryObject = {
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

      testTelemetryObject2 = {
        identifier: {
          namespace: '',
          key: 'test-object2'
        },
        type: 'test-object',
        name: 'Test Object2',
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
              key: 'some-key2',
              name: 'Some attribute2',
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
      overlayPlotObject.composition = [
        {
          identifier: testTelemetryObject.identifier
        },
        {
          identifier: testTelemetryObject2.identifier
        }
      ];
      overlayPlotObject.configuration.series = [
        {
          identifier: testTelemetryObject.identifier,
          yAxisId: 1
        },
        {
          identifier: testTelemetryObject2.identifier,
          yAxisId: 3
        }
      ];
      overlayPlotObject.configuration.additionalYAxes = [
        {
          label: 'Test Object Label',
          id: 2
        },
        {
          label: 'Test Object 2 Label',
          id: 3
        }
      ];
      mockComposition = new EventEmitter();
      mockComposition.load = () => {
        mockComposition.emit('add', testTelemetryObject);
        mockComposition.emit('add', testTelemetryObject2);

        return [testTelemetryObject, testTelemetryObject2];
      };

      spyOn(openmct.composition, 'get').and.returnValue(mockComposition);

      let viewContainer = document.createElement('div');
      child.append(viewContainer);
      component = new Vue({
        el: viewContainer,
        components: {
          Plot
        },
        provide: {
          openmct: openmct,
          domainObject: overlayPlotObject,
          composition: openmct.composition.get(overlayPlotObject),
          path: [overlayPlotObject]
        },
        template: '<plot ref="plotComponent"></plot>'
      });

      return telemetryPromise.then(Vue.nextTick()).then(() => {
        const configId = openmct.objects.makeKeyString(overlayPlotObject.identifier);
        config = configStore.get(configId);
      });
    });

    it('Renders multiple Y-axis for the telemetry objects', (done) => {
      config.yAxis.set('displayRange', {
        min: 10,
        max: 20
      });
      Vue.nextTick(() => {
        let yAxisElement = element.querySelectorAll(
          '.gl-plot-axis-area.gl-plot-y .gl-plot-tick-wrapper'
        );
        expect(yAxisElement.length).toBe(2);
        done();
      });
    });

    describe('the inspector view', () => {
      let inspectorComponent;
      let viewComponentObject;
      let selection;
      beforeEach((done) => {
        selection = [
          [
            {
              context: {
                item: {
                  id: overlayPlotObject.identifier.key,
                  identifier: overlayPlotObject.identifier,
                  type: overlayPlotObject.type,
                  configuration: overlayPlotObject.configuration,
                  composition: overlayPlotObject.composition
                }
              }
            }
          ]
        ];

        let viewContainer = document.createElement('div');
        child.append(viewContainer);
        inspectorComponent = new Vue({
          el: viewContainer,
          components: {
            PlotOptions
          },
          provide: {
            openmct: openmct,
            domainObject: selection[0][0].context.item,
            path: [selection[0][0].context.item]
          },
          template: '<plot-options/>'
        });

        Vue.nextTick(() => {
          viewComponentObject = inspectorComponent.$root.$children[0];
          done();
        });
      });

      afterEach(() => {
        openmct.router.path = null;
      });

      describe('in edit mode', () => {
        let editOptionsEl;

        beforeEach((done) => {
          viewComponentObject.setEditState(true);
          Vue.nextTick(() => {
            editOptionsEl = viewComponentObject.$el.querySelector('.js-plot-options-edit');
            done();
          });
        });

        it('shows multiple yAxis options', () => {
          const yAxisProperties = editOptionsEl.querySelectorAll(
            '.js-yaxis-grid-properties .l-inspector-part h2'
          );
          expect(yAxisProperties.length).toEqual(2);
        });

        it('saves yAxis options', () => {
          //toggle log mode and save
          config.additionalYAxes[1].set('displayRange', {
            min: 10,
            max: 20
          });
          const yAxisProperties = editOptionsEl.querySelectorAll('.js-log-mode-input');
          const clickEvent = createMouseEvent('click');
          yAxisProperties[1].dispatchEvent(clickEvent);

          expect(config.additionalYAxes[1].get('logMode')).toEqual(true);
        });
      });
    });
  });

  describe('The overlay plot view with single axes', () => {
    let testTelemetryObject;
    let config;
    let component;
    let mockComposition;

    afterAll(() => {
      component.$destroy();
      openmct.router.path = null;
    });

    beforeEach(() => {
      testTelemetryObject = {
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

      overlayPlotObject.composition = [
        {
          identifier: testTelemetryObject.identifier
        }
      ];
      overlayPlotObject.configuration.series = [
        {
          identifier: testTelemetryObject.identifier
        }
      ];
      mockComposition = new EventEmitter();
      mockComposition.load = () => {
        mockComposition.emit('add', testTelemetryObject);

        return [testTelemetryObject];
      };

      spyOn(openmct.composition, 'get').and.returnValue(mockComposition);

      let viewContainer = document.createElement('div');
      child.append(viewContainer);
      component = new Vue({
        el: viewContainer,
        components: {
          Plot
        },
        provide: {
          openmct: openmct,
          domainObject: overlayPlotObject,
          composition: openmct.composition.get(overlayPlotObject),
          path: [overlayPlotObject]
        },
        template: '<plot ref="plotComponent"></plot>'
      });

      return telemetryPromise.then(Vue.nextTick()).then(() => {
        const configId = openmct.objects.makeKeyString(overlayPlotObject.identifier);
        config = configStore.get(configId);
      });
    });

    it('Renders single Y-axis for the telemetry object', (done) => {
      config.yAxis.set('displayRange', {
        min: 10,
        max: 20
      });
      Vue.nextTick(() => {
        let yAxisElement = element.querySelectorAll(
          '.gl-plot-axis-area.gl-plot-y .gl-plot-tick-wrapper'
        );
        expect(yAxisElement.length).toBe(1);
        done();
      });
    });
  });
});
