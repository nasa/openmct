/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2026, United States Government
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

// import BarGraph from './BarGraphPlot.vue';
import { EventEmitter } from 'eventemitter3';
import { createOpenMct, resetApplicationState } from 'utils/testing';
import { nextTick } from 'vue';

import { BAR_GRAPH_INSPECTOR_KEY, BAR_GRAPH_KEY, BAR_GRAPH_VIEW } from './BarGraphConstants.js';
import BarGraphPlot from './BarGraphPlot.vue';
import BarGraphPlugin from './plugin.js';

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
        'some-key': ['1.3222'],
        'some-other-key': [1]
      },
      {
        utc: 2,
        'some-key': ['2.555'],
        'some-other-key': [2]
      },
      {
        utc: 3,
        'some-key': ['3.888'],
        'some-other-key': [3]
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

    openmct.install(new BarGraphPlugin());

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

  describe('The bar graph view', () => {
    let barGraphObject;

    let mockComposition;

    beforeEach(async () => {
      barGraphObject = {
        identifier: {
          namespace: '',
          key: 'test-plot'
        },
        configuration: {
          barStyles: {
            series: {}
          },
          axes: {},
          useInterpolation: 'linear',
          useBar: true
        },
        type: 'telemetry.plot.bar-graph',
        name: 'Test Bar Graph'
      };

      mockComposition = new EventEmitter();
      mockComposition.load = () => {
        return [];
      };

      spyOn(openmct.composition, 'get').and.returnValue(mockComposition);

      await nextTick();
    });

    it('provides a bar graph view', () => {
      const applicableViews = openmct.objectViews.get(barGraphObject, mockObjectPath);
      const plotViewProvider = applicableViews.find(
        (viewProvider) => viewProvider.key === BAR_GRAPH_VIEW
      );
      expect(plotViewProvider).toBeDefined();
    });

    xit('Renders plotly bar graph', () => {
      let barChartElement = element.querySelectorAll('.plotly');
      expect(barChartElement.length).toBe(1);
    });

    it('Handles dots in telemetry id', () => {
      const dotFullTelemetryObject = {
        identifier: {
          namespace: 'someNamespace',
          key: '~OpenMCT~outer.test-object.foo.bar'
        },
        type: 'test-dotful-object',
        name: 'A Dotful Object',
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
              key: 'some-key.foo.name.45',
              name: 'Some dotful attribute',
              hints: {
                range: 1
              }
            },
            {
              key: 'some-other-key.bar.344.rad',
              name: 'Another dotful attribute',
              hints: {
                range: 2
              }
            }
          ]
        }
      };

      const applicableViews = openmct.objectViews.get(barGraphObject, mockObjectPath);
      const plotViewProvider = applicableViews.find(
        (viewProvider) => viewProvider.key === BAR_GRAPH_VIEW
      );
      const barGraphView = plotViewProvider.view(barGraphObject, [barGraphObject]);
      barGraphView.show(child, true);
      mockComposition.emit('add', dotFullTelemetryObject);
      expect(
        barGraphObject.configuration.barStyles.series[
          'someNamespace:~OpenMCT~outer.test-object.foo.bar'
        ].name
      ).toEqual('A Dotful Object');
    });
  });

  describe('The spectral plot view for telemetry objects with array values', () => {
    let barGraphObject;

    let mockComposition;

    beforeEach(async () => {
      barGraphObject = {
        identifier: {
          namespace: '',
          key: 'test-plot'
        },
        configuration: {
          barStyles: {
            series: {}
          },
          axes: {
            xKey: 'some-key',
            yKey: 'some-other-key'
          },
          useInterpolation: 'linear',
          useBar: false
        },
        type: 'telemetry.plot.bar-graph',
        name: 'Test Bar Graph'
      };

      mockComposition = new EventEmitter();
      mockComposition.load = () => {
        return [];
      };

      spyOn(openmct.composition, 'get').and.returnValue(mockComposition);

      await nextTick();
    });

    it('Renders spectral plots', async () => {
      const dotFullTelemetryObject = {
        identifier: {
          namespace: 'someNamespace',
          key: '~OpenMCT~outer.test-object.foo.bar'
        },
        type: 'test-dotful-object',
        name: 'A Dotful Object',
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
              formatString: '%0.2f[]',
              hints: {
                range: 1
              },
              source: 'some-key'
            },
            {
              key: 'some-other-key',
              name: 'Another attribute',
              format: 'number[]',
              hints: {
                range: 2
              },
              source: 'some-other-key'
            }
          ]
        }
      };

      const applicableViews = openmct.objectViews.get(barGraphObject, mockObjectPath);
      const plotViewProvider = applicableViews.find(
        (viewProvider) => viewProvider.key === BAR_GRAPH_VIEW
      );
      const barGraphView = plotViewProvider.view(barGraphObject, [barGraphObject]);
      barGraphView.show(child, true);
      mockComposition.emit('add', dotFullTelemetryObject);

      await nextTick();
      await nextTick();

      const plotElement = element.querySelector('.cartesianlayer .scatterlayer .trace .lines');
      expect(plotElement).not.toBeNull();
    });
  });

  describe('the bar graph objects', () => {
    const mockObject = {
      name: 'A very nice bar graph',
      key: BAR_GRAPH_KEY,
      creatable: true
    };

    it('defines a bar graph object type with the correct key', () => {
      const objectDef = openmct.types.get(BAR_GRAPH_KEY).definition;
      expect(objectDef.key).toEqual(mockObject.key);
    });

    it('is creatable', () => {
      const objectDef = openmct.types.get(BAR_GRAPH_KEY).definition;
      expect(objectDef.creatable).toEqual(mockObject.creatable);
    });
  });

  describe('the bar graph axis scaling', () => {
    const getAxisRangeLayout = BarGraphPlot.methods.getAxisRangeLayout;

    it('auto ranges by default', () => {
      const domainObject = { configuration: { yAxis: { autoscale: true } } };

      expect(getAxisRangeLayout.call({ domainObject }, 'yAxis')).toEqual({ autorange: true });
    });

    it('auto ranges for objects saved before axis scaling existed', () => {
      const domainObject = { configuration: { axes: {} } };

      expect(getAxisRangeLayout.call({ domainObject }, 'xAxis')).toEqual({ autorange: true });
      expect(getAxisRangeLayout.call({ domainObject }, 'yAxis')).toEqual({ autorange: true });
    });

    it('applies a fixed range when auto scale is off', () => {
      const domainObject = {
        configuration: {
          yAxis: { autoscale: false, range: { min: -5, max: 5 } }
        }
      };

      expect(getAxisRangeLayout.call({ domainObject }, 'yAxis')).toEqual({
        autorange: false,
        range: [-5, 5]
      });
    });

    it('falls back to auto range when auto scale is off but no range is set', () => {
      const domainObject = { configuration: { yAxis: { autoscale: false } } };

      expect(getAxisRangeLayout.call({ domainObject }, 'yAxis')).toEqual({ autorange: true });
    });

    // yAxisMeta is derived from the traces, so it is undefined until data
    // arrives. A fixed range must still apply to an empty plot.
    it('applies a fixed Y range before any data has arrived', () => {
      const domainObject = {
        configuration: {
          yAxis: { autoscale: false, range: { min: -5, max: 5 } }
        }
      };
      const context = { domainObject, getAxisRangeLayout };

      expect(BarGraphPlot.methods.getYaxisLayout.call(context, undefined)).toEqual({
        autorange: false,
        range: [-5, 5]
      });
    });

    it('includes the configured range in the plot layout', () => {
      const domainObject = {
        configuration: {
          xAxis: { autoscale: false, range: { min: 0, max: 100 } },
          yAxis: { autoscale: false, range: { min: -5, max: 5 } }
        }
      };
      const context = {
        domainObject,
        data: [],
        plotAxisTitle: {},
        getAxisRangeLayout,
        getYAxisMeta: BarGraphPlot.methods.getYAxisMeta,
        getXAxisDomain: BarGraphPlot.methods.getXAxisDomain,
        getYaxisLayout: BarGraphPlot.methods.getYaxisLayout
      };

      const layout = BarGraphPlot.methods.getLayout.call(context);

      expect(layout.xaxis.range).toEqual([0, 100]);
      expect(layout.xaxis.autorange).toBe(false);
    });
  });

  describe('The bar graph composition policy', () => {
    it('allows composition for telemetry that contain at least one range', () => {
      const parent = {
        composition: [],
        configuration: {},
        name: 'Some Bar Graph',
        type: 'telemetry.plot.bar-graph',
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
              source: 'some-key',
              name: 'Some attribute',
              format: 'enum',
              enumerations: [
                {
                  value: 0,
                  string: 'OFF'
                },
                {
                  value: 1,
                  string: 'ON'
                }
              ],
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
      }).not.toThrow();
      expect(parent.composition.length).toBe(1);
    });

    it("disallows composition for telemetry that don't contain any range hints", () => {
      const parent = {
        composition: [],
        configuration: {},
        name: 'Some Bar Graph',
        type: 'telemetry.plot.bar-graph',
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
              name: 'Some attribute'
            },
            {
              key: 'some-other-key',
              name: 'Another attribute'
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
    it('disallows composition for condition sets', () => {
      const parent = {
        composition: [],
        configuration: {},
        name: 'Some Bar Graph',
        type: 'telemetry.plot.bar-graph',
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
        type: 'conditionSet',
        name: 'Test Object',
        telemetry: {
          values: [
            {
              key: 'some-key',
              name: 'Some attribute',
              format: 'enum',
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
          key: '~Some~foo.bar'
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
                type: 'telemetry.plot.bar-graph',
                configuration: {
                  barStyles: {
                    series: {
                      '~Some~foo.bar': {
                        name: 'A telemetry object',
                        type: 'some-type',
                        isAlias: true
                      }
                    }
                  },
                  axes: {},
                  useInterpolation: 'linear',
                  useBar: true
                },
                composition: [
                  {
                    identifier: {
                      key: '~Some~foo.bar'
                    }
                  }
                ]
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

      mockComposition = new EventEmitter();
      mockComposition.load = () => {
        mockComposition.emit('add', testDomainObject);

        return [testDomainObject];
      };

      spyOn(openmct.composition, 'get').and.returnValue(mockComposition);

      viewContainer = document.createElement('div');
      child.append(viewContainer);

      const applicableViews = openmct.inspectorViews.get(selection);
      plotInspectorView = applicableViews.filter((view) => view.key === BAR_GRAPH_INSPECTOR_KEY)[0];
      plotInspectorView.show(viewContainer);

      await nextTick();
      optionsElement = element.querySelector('.c-bar-graph-options');
    });

    afterEach(() => {
      plotInspectorView.destroy();
    });

    it('it renders the options', () => {
      expect(optionsElement).toBeDefined();
    });

    it('shows the name', () => {
      const seriesEl = optionsElement.querySelector('.c-object-label__name');
      expect(seriesEl.innerHTML).toEqual('A telemetry object');
    });
  });
});
