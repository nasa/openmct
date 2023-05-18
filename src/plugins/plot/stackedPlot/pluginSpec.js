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
import StackedPlot from './StackedPlot.vue';
import configStore from '../configuration/ConfigStore';
import EventEmitter from 'EventEmitter';
import PlotConfigurationModel from '../configuration/PlotConfigurationModel';
import PlotOptions from '../inspector/PlotOptions.vue';

describe('the plugin', function () {
  let element;
  let child;
  let openmct;
  let telemetryPromise;
  let telemetryPromiseResolve;
  let mockObjectPath;
  let stackedPlotObject = {
    identifier: {
      namespace: '',
      key: 'test-plot'
    },
    type: 'telemetry.plot.stacked',
    name: 'Test Stacked Plot',
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

    openmct.router.path = [stackedPlotObject];
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
    it('provides a stacked plot view for objects with telemetry', () => {
      const testTelemetryObject = {
        id: 'test-object',
        type: 'telemetry.plot.stacked',
        telemetry: {
          values: [
            {
              key: 'some-key'
            }
          ]
        }
      };

      const applicableViews = openmct.objectViews.get(testTelemetryObject, mockObjectPath);
      let plotView = applicableViews.find((viewProvider) => viewProvider.key === 'plot-stacked');
      expect(plotView).toBeDefined();
    });
  });

  describe('The stacked plot view', () => {
    let testTelemetryObject;
    let testTelemetryObject2;
    let config;
    let component;
    let mockCompositionList = [];
    let plotViewComponentObject;

    afterAll(() => {
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
        },
        configuration: {
          objectStyles: {
            staticStyle: {
              style: {
                backgroundColor: 'rgb(0, 200, 0)',
                color: '',
                border: ''
              }
            },
            conditionSetIdentifier: {
              namespace: '',
              key: 'testConditionSetId'
            },
            selectedConditionId: 'conditionId1',
            defaultConditionId: 'conditionId1',
            styles: [
              {
                conditionId: 'conditionId1',
                style: {
                  backgroundColor: 'rgb(0, 155, 0)',
                  color: '',
                  output: '',
                  border: ''
                }
              }
            ]
          }
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

      stackedPlotObject.composition = [
        {
          identifier: testTelemetryObject.identifier
        }
      ];

      mockCompositionList = [];
      spyOn(openmct.composition, 'get').and.callFake((domainObject) => {
        //We need unique compositions here - one for the StackedPlot view and one for the PlotLegend view
        const numObjects = domainObject.composition.length;
        const mockComposition = new EventEmitter();
        mockComposition.load = () => {
          if (numObjects === 1) {
            mockComposition.emit('add', testTelemetryObject);

            return [testTelemetryObject];
          } else if (numObjects === 2) {
            mockComposition.emit('add', testTelemetryObject);
            mockComposition.emit('add', testTelemetryObject2);

            return [testTelemetryObject, testTelemetryObject2];
          } else {
            return [];
          }
        };

        mockCompositionList.push(mockComposition);

        return mockComposition;
      });

      let viewContainer = document.createElement('div');
      child.append(viewContainer);
      component = new Vue({
        el: viewContainer,
        components: {
          StackedPlot
        },
        provide: {
          openmct: openmct,
          domainObject: stackedPlotObject,
          path: [stackedPlotObject]
        },
        template: '<stacked-plot></stacked-plot>'
      });

      return telemetryPromise.then(Vue.nextTick()).then(() => {
        plotViewComponentObject = component.$root.$children[0];
        const configId = openmct.objects.makeKeyString(testTelemetryObject.identifier);
        config = configStore.get(configId);
      });
    });

    it('Renders a collapsed legend for every telemetry', () => {
      let legend = element.querySelectorAll('.plot-wrapper-collapsed-legend .plot-series-name');
      expect(legend.length).toBe(1);
      expect(legend[0].innerHTML).toEqual('Test Object');
    });

    it('Renders an expanded legend for every telemetry', () => {
      let legendControl = element.querySelector(
        '.c-plot-legend__view-control.gl-plot-legend__view-control.c-disclosure-triangle'
      );
      const clickEvent = createMouseEvent('click');

      legendControl.dispatchEvent(clickEvent);

      let legend = element.querySelectorAll('.plot-wrapper-expanded-legend .plot-legend-item td');
      expect(legend.length).toBe(6);
    });

    // disable due to flakiness
    xit('Renders X-axis ticks for the telemetry object', () => {
      let xAxisElement = element.querySelectorAll(
        '.gl-plot-axis-area.gl-plot-x .gl-plot-tick-wrapper'
      );
      expect(xAxisElement.length).toBe(1);

      config.xAxis.set('displayRange', {
        min: 0,
        max: 4
      });
      let ticks = xAxisElement[0].querySelectorAll('.gl-plot-tick');
      expect(ticks.length).toBe(9);
    });

    it('Renders Y-axis ticks for the telemetry object', (done) => {
      config.yAxis.set('displayRange', {
        min: 10,
        max: 20
      });
      Vue.nextTick(() => {
        let yAxisElement = element.querySelectorAll(
          '.gl-plot-axis-area.gl-plot-y .gl-plot-tick-wrapper'
        );
        expect(yAxisElement.length).toBe(1);
        let ticks = yAxisElement[0].querySelectorAll('.gl-plot-tick');
        expect(ticks.length).toBe(6);
        done();
      });
    });

    it('Renders Y-axis options for the telemetry object', () => {
      let yAxisElement = element.querySelectorAll(
        '.gl-plot-axis-area.gl-plot-y .gl-plot-y-label__select'
      );
      expect(yAxisElement.length).toBe(1);
      let options = yAxisElement[0].querySelectorAll('option');
      expect(options.length).toBe(2);
      expect(options[0].value).toBe('Some attribute');
      expect(options[1].value).toBe('Another attribute');
    });

    it('turns on cursor Guides all telemetry objects', (done) => {
      expect(plotViewComponentObject.cursorGuide).toBeFalse();
      plotViewComponentObject.cursorGuide = true;
      Vue.nextTick(() => {
        let childCursorGuides = element.querySelectorAll('.c-cursor-guide--v');
        expect(childCursorGuides.length).toBe(1);
        done();
      });
    });

    it('shows grid lines for all telemetry objects', () => {
      expect(plotViewComponentObject.gridLines).toBeTrue();
      let gridLinesContainer = element.querySelectorAll('.gl-plot-display-area .js-ticks');
      let visible = 0;
      gridLinesContainer.forEach((el) => {
        if (el.style.display !== 'none') {
          visible++;
        }
      });
      expect(visible).toBe(2);
    });

    it('hides grid lines for all telemetry objects', (done) => {
      expect(plotViewComponentObject.gridLines).toBeTrue();
      plotViewComponentObject.gridLines = false;
      Vue.nextTick(() => {
        expect(plotViewComponentObject.gridLines).toBeFalse();
        let gridLinesContainer = element.querySelectorAll('.gl-plot-display-area .js-ticks');
        let visible = 0;
        gridLinesContainer.forEach((el) => {
          if (el.style.display !== 'none') {
            visible++;
          }
        });
        expect(visible).toBe(0);
        done();
      });
    });

    it('plots a new series when a new telemetry object is added', (done) => {
      //setting composition here so that any new triggers to composition.load with correctly load the mockComposition in the beforeEach
      stackedPlotObject.composition = [testTelemetryObject, testTelemetryObject2];
      mockCompositionList[0].emit('add', testTelemetryObject2);

      Vue.nextTick(() => {
        let legend = element.querySelectorAll('.plot-wrapper-collapsed-legend .plot-series-name');
        expect(legend.length).toBe(2);
        expect(legend[1].innerHTML).toEqual('Test Object2');
        done();
      });
    });

    it('removes plots from series when a telemetry object is removed', (done) => {
      stackedPlotObject.composition = [];
      mockCompositionList[0].emit('remove', testTelemetryObject.identifier);
      Vue.nextTick(() => {
        expect(plotViewComponentObject.compositionObjects.length).toBe(0);
        done();
      });
    });

    it('Changes the label of the y axis when the option changes', (done) => {
      let selectEl = element.querySelector('.gl-plot-y-label__select');
      selectEl.value = 'Another attribute';
      selectEl.dispatchEvent(new Event('change'));

      Vue.nextTick(() => {
        expect(config.yAxis.get('label')).toEqual('Another attribute');
        done();
      });
    });

    it('Adds a new point to the plot', (done) => {
      let originalLength = config.series.models[0].getSeriesData().length;
      config.series.models[0].add({
        utc: 2,
        'some-key': 1,
        'some-other-key': 2
      });
      Vue.nextTick(() => {
        const seriesData = config.series.models[0].getSeriesData();
        expect(seriesData.length).toEqual(originalLength + 1);
        done();
      });
    });

    it('updates the xscale', (done) => {
      config.xAxis.set('displayRange', {
        min: 0,
        max: 10
      });
      Vue.nextTick(() => {
        expect(plotViewComponentObject.$children[0].component.$children[1].xScale.domain()).toEqual(
          {
            min: 0,
            max: 10
          }
        );
        done();
      });
    });

    it('updates the yscale', (done) => {
      const yAxisList = [config.yAxis, ...config.additionalYAxes];
      yAxisList.forEach((yAxis) => {
        yAxis.set('displayRange', {
          min: 10,
          max: 20
        });
      });
      Vue.nextTick(() => {
        const yAxesScales = plotViewComponentObject.$children[0].component.$children[1].yScale;
        yAxesScales.forEach((yAxisScale) => {
          expect(yAxisScale.scale.domain()).toEqual({
            min: 10,
            max: 20
          });
        });
        done();
      });
    });

    it('shows styles for telemetry objects if available', (done) => {
      Vue.nextTick(() => {
        let conditionalStylesContainer = element.querySelectorAll(
          '.c-plot--stacked-container .js-style-receiver'
        );
        let hasStyles = 0;
        conditionalStylesContainer.forEach((el) => {
          if (el.style.backgroundColor !== '') {
            hasStyles++;
          }
        });
        expect(hasStyles).toBe(1);
        done();
      });
    });
  });

  describe('the stacked plot inspector view', () => {
    let component;
    let viewComponentObject;
    let mockComposition;
    let testTelemetryObject;
    let selection;
    let config;
    beforeEach((done) => {
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

      selection = [
        [
          {
            context: {
              item: {
                type: 'telemetry.plot.stacked',
                identifier: {
                  key: 'some-stacked-plot',
                  namespace: ''
                },
                configuration: {
                  series: []
                }
              }
            }
          }
        ]
      ];

      openmct.router.path = [testTelemetryObject];
      mockComposition = new EventEmitter();
      mockComposition.load = () => {
        mockComposition.emit('add', testTelemetryObject);

        return [testTelemetryObject];
      };

      spyOn(openmct.composition, 'get').and.returnValue(mockComposition);

      const configId = openmct.objects.makeKeyString(selection[0][0].context.item.identifier);
      config = new PlotConfigurationModel({
        id: configId,
        domainObject: selection[0][0].context.item,
        openmct: openmct
      });
      configStore.add(configId, config);

      let viewContainer = document.createElement('div');
      child.append(viewContainer);
      component = new Vue({
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
        viewComponentObject = component.$root.$children[0];
        done();
      });
    });

    afterEach(() => {
      openmct.router.path = null;
    });

    describe('in view only mode', () => {
      let browseOptionsEl;
      beforeEach(() => {
        browseOptionsEl = viewComponentObject.$el.querySelector('.js-plot-options-browse');
      });

      it('shows legend properties', () => {
        const legendPropertiesEl = browseOptionsEl.querySelector('.js-legend-properties');
        expect(legendPropertiesEl).not.toBeNull();
      });

      it('does not show series properties', () => {
        const seriesPropertiesEl = browseOptionsEl.querySelector('.c-tree');
        expect(seriesPropertiesEl).toBeNull();
      });

      it('does not show yaxis properties', () => {
        const yAxisPropertiesEl = browseOptionsEl.querySelector('.js-yaxis-properties');
        expect(yAxisPropertiesEl).toBeNull();
      });
    });
  });

  describe('inspector view of stacked plot child', () => {
    let component;
    let viewComponentObject;
    let mockComposition;
    let testTelemetryObject;
    let selection;
    let config;
    beforeEach((done) => {
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
                type: 'telemetry.plot.overlay',
                configuration: {
                  series: [
                    {
                      identifier: {
                        key: 'test-object',
                        namespace: ''
                      }
                    }
                  ]
                },
                composition: []
              }
            }
          },
          {
            context: {
              item: {
                type: 'telemetry.plot.stacked',
                identifier: {
                  key: 'some-stacked-plot',
                  namespace: ''
                },
                configuration: {
                  series: []
                }
              }
            }
          }
        ]
      ];

      openmct.router.path = [testTelemetryObject];
      mockComposition = new EventEmitter();
      mockComposition.load = () => {
        mockComposition.emit('add', testTelemetryObject);

        return [testTelemetryObject];
      };

      spyOn(openmct.composition, 'get').and.returnValue(mockComposition);

      const configId = openmct.objects.makeKeyString(selection[0][0].context.item.identifier);
      config = new PlotConfigurationModel({
        id: configId,
        domainObject: selection[0][0].context.item,
        openmct: openmct
      });
      configStore.add(configId, config);

      let viewContainer = document.createElement('div');
      child.append(viewContainer);
      component = new Vue({
        el: viewContainer,
        components: {
          PlotOptions
        },
        provide: {
          openmct: openmct,
          domainObject: selection[0][0].context.item,
          path: [selection[0][0].context.item, selection[0][1].context.item]
        },
        template: '<plot-options/>'
      });

      Vue.nextTick(() => {
        viewComponentObject = component.$root.$children[0];
        done();
      });
    });

    afterEach(() => {
      openmct.router.path = null;
    });

    describe('in view only mode', () => {
      let browseOptionsEl;
      beforeEach(() => {
        browseOptionsEl = viewComponentObject.$el.querySelector('.js-plot-options-browse');
      });

      it('hides legend properties', () => {
        const legendPropertiesEl = browseOptionsEl.querySelector('.js-legend-properties');
        expect(legendPropertiesEl).toBeNull();
      });

      it('shows series properties', () => {
        const seriesPropertiesEl = browseOptionsEl.querySelector('.c-tree');
        expect(seriesPropertiesEl).not.toBeNull();
      });

      it('shows yaxis properties', () => {
        const yAxisPropertiesEl = browseOptionsEl.querySelector('.js-yaxis-properties');
        expect(yAxisPropertiesEl).not.toBeNull();
      });
    });
  });
});
