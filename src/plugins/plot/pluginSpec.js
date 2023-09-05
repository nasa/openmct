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

import EventEmitter from 'EventEmitter';
import mount from 'utils/mount';
import {
  createMouseEvent,
  createOpenMct,
  resetApplicationState,
  spyOnBuiltins
} from 'utils/testing';
import Vue from 'vue';

import configStore from './configuration/ConfigStore';
import PlotConfigurationModel from './configuration/PlotConfigurationModel';
import PlotOptions from './inspector/PlotOptions.vue';
import PlotVuePlugin from './plugin';

const TEST_KEY_ID = 'some-other-key';

describe('the plugin', function () {
  let element;
  let child;
  let openmct;
  let telemetryPromise;
  let telemetryPromiseResolve;
  let mockObjectPath;
  let telemetrylimitProvider;

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

    telemetrylimitProvider = jasmine.createSpyObj('telemetrylimitProvider', [
      'supportsLimits',
      'getLimits',
      'getLimitEvaluator'
    ]);
    telemetrylimitProvider.supportsLimits.and.returnValue(true);
    telemetrylimitProvider.getLimits.and.returnValue({
      limits: function () {
        return Promise.resolve({
          WARNING: {
            low: {
              cssClass: 'is-limit--lwr is-limit--yellow',
              'some-key': -0.5
            },
            high: {
              cssClass: 'is-limit--upr is-limit--yellow',
              'some-key': 0.5
            }
          },
          DISTRESS: {
            low: {
              cssClass: 'is-limit--lwr is-limit--red',
              'some-key': -0.9
            },
            high: {
              cssClass: 'is-limit--upr is-limit--red',
              'some-key': 0.9
            }
          }
        });
      }
    });
    telemetrylimitProvider.getLimitEvaluator.and.returnValue({
      evaluate: function () {
        return {};
      }
    });
    openmct.telemetry.addProvider(telemetrylimitProvider);

    openmct.install(new PlotVuePlugin());

    element = document.createElement('div');
    element.style.width = '640px';
    element.style.height = '480px';
    child = document.createElement('div');
    child.style.width = '640px';
    child.style.height = '480px';
    element.appendChild(child);
    document.body.appendChild(element);

    openmct.types.addType('test-object', {
      creatable: true
    });

    spyOnBuiltins(['requestAnimationFrame']);
    window.requestAnimationFrame.and.callFake((callBack) => {
      callBack();
    });

    openmct.on('start', done);
    openmct.startHeadless();
  });

  afterEach(async () => {
    openmct.time.setTimeSystem('utc', {
      start: 0,
      end: 2
    });

    await Vue.nextTick();
    configStore.deleteAll();
    return resetApplicationState(openmct);
  });

  describe('the plot views', () => {
    it('provides a plot view for objects with telemetry', () => {
      const testTelemetryObject = {
        id: 'test-object',
        type: 'test-object',
        telemetry: {
          values: [
            {
              key: 'some-key',
              hints: {
                domain: 1
              }
            },
            {
              key: 'other-key',
              hints: {
                range: 1
              }
            },
            {
              key: 'yet-another-key',
              format: 'string',
              hints: {
                range: 2
              }
            }
          ]
        }
      };

      const applicableViews = openmct.objectViews.get(testTelemetryObject, mockObjectPath);
      const plotView = applicableViews.find((viewProvider) => viewProvider.key === 'plot-single');

      expect(plotView).toBeDefined();
    });

    it('does not provide a plot view if the telemetry is entirely non numeric', () => {
      const testTelemetryObject = {
        id: 'test-object',
        type: 'test-object',
        telemetry: {
          values: [
            {
              key: 'some-key',
              hints: {
                domain: 1
              }
            },
            {
              key: 'other-key',
              format: 'string',
              hints: {
                range: 1
              }
            },
            {
              key: 'yet-another-key',
              format: 'string',
              hints: {
                range: 1
              }
            }
          ]
        }
      };

      const applicableViews = openmct.objectViews.get(testTelemetryObject, mockObjectPath);
      const plotView = applicableViews.find((viewProvider) => viewProvider.key === 'plot-single');

      expect(plotView).toBeUndefined();
    });

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

    it('provides an inspector view for overlay plots', () => {
      let selection = [
        [
          {
            context: {
              item: {
                id: 'test-object',
                type: 'telemetry.plot.overlay',
                telemetry: {
                  values: [
                    {
                      key: 'some-key'
                    }
                  ]
                }
              }
            }
          },
          {
            context: {
              item: {
                type: 'time-strip'
              }
            }
          }
        ]
      ];
      const applicableInspectorViews = openmct.inspectorViews.get(selection);
      const plotInspectorView = applicableInspectorViews.find(
        (view) => (view.name = 'Plots Configuration')
      );

      expect(plotInspectorView).toBeDefined();
    });

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

  describe('The single plot view', () => {
    let testTelemetryObject;
    let applicableViews;
    let plotViewProvider;
    let plotView;

    beforeEach(() => {
      openmct.time.timeSystem('utc', {
        start: 0,
        end: 4
      });
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

      openmct.router.path = [testTelemetryObject];

      applicableViews = openmct.objectViews.get(testTelemetryObject, mockObjectPath);
      plotViewProvider = applicableViews.find((viewProvider) => viewProvider.key === 'plot-single');
      plotView = plotViewProvider.view(testTelemetryObject, []);
      plotView.show(child, true);

      return Vue.nextTick();
    });

    afterEach(() => {
      openmct.router.path = null;
    });

    it('Makes only one request for telemetry on load', () => {
      expect(openmct.telemetry.request).toHaveBeenCalledTimes(1);
    });

    it('Renders a collapsed legend for every telemetry', async () => {
      await Vue.nextTick();
      let legend = element.querySelectorAll('.plot-wrapper-collapsed-legend .plot-series-name');
      expect(legend.length).toBe(1);
      expect(legend[0].innerHTML).toEqual('Test Object');
    });

    it('Renders an expanded legend for every telemetry', async () => {
      await Vue.nextTick();
      let legendControl = element.querySelector(
        '.c-plot-legend__view-control.gl-plot-legend__view-control.c-disclosure-triangle'
      );
      const clickEvent = createMouseEvent('click');

      legendControl.dispatchEvent(clickEvent);

      let legend = element.querySelectorAll('.plot-wrapper-expanded-legend .plot-legend-item td');
      expect(legend.length).toBe(6);
    });

    it('Renders X-axis ticks for the telemetry object', (done) => {
      const configId = openmct.objects.makeKeyString(testTelemetryObject.identifier);
      const config = configStore.get(configId);
      config.xAxis.set('displayRange', {
        min: 0,
        max: 4
      });

      Vue.nextTick(() => {
        let xAxisElement = element.querySelectorAll(
          '.gl-plot-axis-area.gl-plot-x .gl-plot-tick-wrapper'
        );
        expect(xAxisElement.length).toBe(1);

        let ticks = xAxisElement[0].querySelectorAll('.gl-plot-tick');
        expect(ticks.length).toBe(9);

        done();
      });
    });

    it('Renders Y-axis options for the telemetry object', async () => {
      await Vue.nextTick();
      let yAxisElement = element.querySelectorAll(
        '.gl-plot-axis-area.gl-plot-y .gl-plot-y-label__select'
      );
      expect(yAxisElement.length).toBe(1);
      //Object{name: "Some attribute", key: "some-key"}, Object{name: "Another attribute", key: "some-other-key"}
      let options = yAxisElement[0].querySelectorAll('option');
      expect(options.length).toBe(2);
      expect(options[0].value).toBe('Some attribute');
      expect(options[1].value).toBe('Another attribute');
    });

    xit('Updates the Y-axis label when changed', () => {
      const configId = openmct.objects.makeKeyString(testTelemetryObject.identifier);
      const config = configStore.get(configId);
      const yAxisElement = element.querySelectorAll('.gl-plot-axis-area.gl-plot-y')[0].__vue__;
      config.yAxis.seriesCollection.models.forEach((plotSeries) => {
        expect(plotSeries.model.yKey).toBe('some-key');
      });

      yAxisElement.$emit('yKeyChanged', TEST_KEY_ID, 1);
      config.yAxis.seriesCollection.models.forEach((plotSeries) => {
        expect(plotSeries.model.yKey).toBe(TEST_KEY_ID);
      });
    });

    it('hides the pause and play controls', () => {
      let pauseEl = element.querySelectorAll('.c-button-set .icon-pause');
      let playEl = element.querySelectorAll('.c-button-set .icon-arrow-right');
      expect(pauseEl.length).toBe(0);
      expect(playEl.length).toBe(0);
    });

    describe('pause and play controls', () => {
      beforeEach(() => {
        openmct.time.setClock('local');
        openmct.time.setClockOffsets({
          start: -1000,
          end: 100
        });

        return Vue.nextTick();
      });

      it('shows the pause controls', (done) => {
        Vue.nextTick(() => {
          let pauseEl = element.querySelectorAll('.c-button-set .icon-pause');
          expect(pauseEl.length).toBe(1);
          done();
        });
      });

      it('shows the play control if plot is paused', (done) => {
        let pauseEl = element.querySelector('.c-button-set .icon-pause');
        const clickEvent = createMouseEvent('click');

        pauseEl.dispatchEvent(clickEvent);
        Vue.nextTick(() => {
          let playEl = element.querySelectorAll('.c-button-set .is-paused');
          expect(playEl.length).toBe(1);
          done();
        });
      });
    });

    describe('resume actions on errant click', () => {
      beforeEach(() => {
        openmct.time.setClock('local');
        openmct.time.setClockOffsets({
          start: -1000,
          end: 100
        });

        return Vue.nextTick();
      });

      it('clicking the plot view without movement resumes the plot while active', async () => {
        const pauseEl = element.querySelectorAll('.c-button-set .icon-pause');
        // if the pause button is present, the chart is running
        expect(pauseEl.length).toBe(1);

        // simulate an errant mouse click
        // the second item is the canvas we need to use
        const canvas = element.querySelectorAll('canvas')[1];
        const mouseDownEvent = new MouseEvent('mousedown');
        const mouseUpEvent = new MouseEvent('mouseup');
        canvas.dispatchEvent(mouseDownEvent);
        // mouseup event is bound to the window
        window.dispatchEvent(mouseUpEvent);
        await Vue.nextTick();

        const pauseElAfterClick = element.querySelectorAll('.c-button-set .icon-pause');
        console.log('pauseElAfterClick', pauseElAfterClick);
        expect(pauseElAfterClick.length).toBe(1);
      });

      it('clicking the plot view without movement leaves the plot paused', async () => {
        const pauseEl = element.querySelector('.c-button-set .icon-pause');
        // pause the plot
        pauseEl.dispatchEvent(createMouseEvent('click'));
        await Vue.nextTick();

        const playEl = element.querySelectorAll('.c-button-set .is-paused');
        expect(playEl.length).toBe(1);

        // simulate an errant mouse click
        // the second item is the canvas we need to use
        const canvas = element.querySelectorAll('canvas')[1];
        const mouseDownEvent = new MouseEvent('mousedown');
        const mouseUpEvent = new MouseEvent('mouseup');
        canvas.dispatchEvent(mouseDownEvent);
        // mouseup event is bound to the window
        window.dispatchEvent(mouseUpEvent);
        await Vue.nextTick();

        const playElAfterChartClick = element.querySelectorAll('.c-button-set .is-paused');
        expect(playElAfterChartClick.length).toBe(1);
      });

      it('clicking the plot does not request historical data', async () => {
        expect(openmct.telemetry.request).toHaveBeenCalledTimes(2);

        // simulate an errant mouse click
        // the second item is the canvas we need to use
        const canvas = element.querySelectorAll('canvas')[1];
        const mouseDownEvent = new MouseEvent('mousedown');
        const mouseUpEvent = new MouseEvent('mouseup');
        canvas.dispatchEvent(mouseDownEvent);
        // mouseup event is bound to the window
        window.dispatchEvent(mouseUpEvent);
        await Vue.nextTick();

        expect(openmct.telemetry.request).toHaveBeenCalledTimes(2);
      });

      describe('limits', () => {
        it('lines are not displayed by default', () => {
          let limitEl = element.querySelectorAll('.js-limit-area .js-limit-line');
          expect(limitEl.length).toBe(0);
        });

        it('lines are displayed when configuration is set to true', async () => {
          await Vue.nextTick();
          const configId = openmct.objects.makeKeyString(testTelemetryObject.identifier);
          const config = configStore.get(configId);
          config.yAxis.set('displayRange', {
            min: 0,
            max: 4
          });
          config.series.models[0].set('limitLines', true);

          await Vue.nextTick();
          let limitEl = element.querySelectorAll('.js-limit-area .js-limit-line');
          expect(limitEl.length).toBe(4);
        });
      });
    });

    describe('controls in time strip view', () => {
      it('zoom controls are hidden', () => {
        let pauseEl = element.querySelectorAll('.c-button-set .js-zoom');
        expect(pauseEl.length).toBe(0);
      });

      it('pan controls are hidden', () => {
        let pauseEl = element.querySelectorAll('.c-button-set .js-pan');
        expect(pauseEl.length).toBe(0);
      });

      it('pause/play controls are hidden', () => {
        let pauseEl = element.querySelectorAll('.c-button-set .js-pause');
        expect(pauseEl.length).toBe(0);
      });
    });
  });

  describe('resizing the plot', () => {
    let plotContainerResizeObserver;
    let resizePromiseResolve;
    let testTelemetryObject;
    let applicableViews;
    let plotViewProvider;
    let plotView;
    let resizePromise;

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

      openmct.router.path = [testTelemetryObject];

      applicableViews = openmct.objectViews.get(testTelemetryObject, mockObjectPath);
      plotViewProvider = applicableViews.find((viewProvider) => viewProvider.key === 'plot-single');
      plotView = plotViewProvider.view(testTelemetryObject, []);

      plotView.show(child, true);

      resizePromise = new Promise((resolve) => {
        resizePromiseResolve = resolve;
      });

      const handlePlotResize = _.debounce(() => {
        resizePromiseResolve(true);
      }, 600);

      plotContainerResizeObserver = new ResizeObserver(handlePlotResize);
      plotContainerResizeObserver.observe(
        plotView.getComponent().$children[0].$children[1].$parent.$refs.plotWrapper
      );

      return Vue.nextTick(() => {
        plotView.getComponent().$children[0].$children[1].stopFollowingTimeContext();
        spyOn(
          plotView.getComponent().$children[0].$children[1],
          'loadSeriesData'
        ).and.callThrough();
      });
    });

    afterEach(() => {
      plotContainerResizeObserver.disconnect();
      openmct.router.path = null;
    });

    xit('requests historical data when over the threshold', async () => {
      await Vue.nextTick();
      element.style.width = '680px';
      await resizePromise;
      expect(
        plotView.getComponent().$children[0].$children[1].loadSeriesData
      ).toHaveBeenCalledTimes(1);
    });

    it('does not request historical data when under the threshold', (done) => {
      element.style.width = '644px';
      resizePromise.then(() => {
        expect(
          plotView.getComponent().$children[0].$children[1].loadSeriesData
        ).not.toHaveBeenCalled();
        done();
      });
    });
  });

  describe('the inspector view', () => {
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
                type: 'time-strip',
                identifier: {
                  key: 'some-other-key',
                  namespace: ''
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
      const { vNode } = mount(
        {
          components: {
            PlotOptions
          },
          provide: {
            openmct: openmct,
            domainObject: selection[0][0].context.item,
            path: [selection[0][0].context.item, selection[0][1].context.item]
          },
          template: '<plot-options/>'
        },
        {
          element: viewContainer
        }
      );
      component = vNode.componentInstance;

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
      let editOptionsEl;
      beforeEach(() => {
        browseOptionsEl = viewComponentObject.$el.querySelector('.js-plot-options-browse');
        editOptionsEl = viewComponentObject.$el.querySelector('.js-plot-options-edit');
      });

      it('does not show the edit options', () => {
        expect(editOptionsEl).toBeNull();
      });

      it('shows the name', () => {
        const seriesEl = browseOptionsEl.querySelector('.c-object-label__name');
        expect(seriesEl.innerHTML).toEqual(testTelemetryObject.name);
      });

      it('shows in collapsed mode', () => {
        const seriesEl = browseOptionsEl.querySelectorAll('.c-disclosure-triangle--expanded');
        expect(seriesEl.length).toEqual(0);
      });

      it('shows in expanded mode', () => {
        let expandControl = browseOptionsEl.querySelector('.c-disclosure-triangle');
        const clickEvent = createMouseEvent('click');
        expandControl.dispatchEvent(clickEvent);

        const plotOptionsProperties = browseOptionsEl.querySelectorAll(
          '.js-plot-options-browse-properties .grid-row'
        );
        expect(plotOptionsProperties.length).toEqual(6);
      });
    });

    describe('in edit mode', () => {
      let editOptionsEl;
      let browseOptionsEl;

      beforeEach((done) => {
        viewComponentObject.setEditState(true);
        Vue.nextTick(() => {
          editOptionsEl = viewComponentObject.$el.querySelector('.js-plot-options-edit');
          browseOptionsEl = viewComponentObject.$el.querySelector('.js-plot-options-browse');
          done();
        });
      });

      it('does not show the browse options', () => {
        expect(browseOptionsEl).toBeNull();
      });

      it('shows the name', () => {
        const seriesEl = editOptionsEl.querySelector('.c-object-label__name');
        expect(seriesEl.innerHTML).toEqual(testTelemetryObject.name);
      });

      it('shows in collapsed mode', () => {
        const seriesEl = editOptionsEl.querySelectorAll('.c-disclosure-triangle--expanded');
        expect(seriesEl.length).toEqual(0);
      });

      it('shows in collapsed mode', () => {
        const seriesEl = editOptionsEl.querySelectorAll('.c-disclosure-triangle--expanded');
        expect(seriesEl.length).toEqual(0);
      });

      it('renders expanded', () => {
        const expandControl = editOptionsEl.querySelector('.c-disclosure-triangle');
        const clickEvent = createMouseEvent('click');
        expandControl.dispatchEvent(clickEvent);

        const plotOptionsProperties = editOptionsEl.querySelectorAll(
          '.js-plot-options-edit-properties .grid-row'
        );
        expect(plotOptionsProperties.length).toEqual(8);
      });

      it('shows yKeyOptions', () => {
        const expandControl = editOptionsEl.querySelector('.c-disclosure-triangle');
        const clickEvent = createMouseEvent('click');
        expandControl.dispatchEvent(clickEvent);

        const plotOptionsProperties = editOptionsEl.querySelectorAll(
          '.js-plot-options-edit-properties .grid-row'
        );

        const yKeySelection = plotOptionsProperties[0].querySelector('select');
        const options = Array.from(yKeySelection.options).map((option) => {
          return option.value;
        });
        expect(options).toEqual([
          testTelemetryObject.telemetry.values[1].key,
          testTelemetryObject.telemetry.values[2].key
        ]);
      });

      it('shows yAxis options', () => {
        const expandControl = editOptionsEl.querySelector('.c-disclosure-triangle');
        const clickEvent = createMouseEvent('click');
        expandControl.dispatchEvent(clickEvent);

        const yAxisProperties = editOptionsEl.querySelectorAll(
          'div.grid-properties:first-of-type .l-inspector-part'
        );

        // TODO better test
        expect(yAxisProperties.length).toEqual(2);
      });

      it('renders color palette options', () => {
        const colorSwatch = editOptionsEl.querySelector('.c-click-swatch');
        expect(colorSwatch).toBeDefined();
      });
    });
  });
});
