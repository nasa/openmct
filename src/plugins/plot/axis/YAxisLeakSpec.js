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
import mount from 'utils/mount';
import { nextTick } from 'vue';

import { createOpenMct, resetApplicationState } from '../../../utils/testing.js';
import configStore from '../configuration/ConfigStore.js';
import PlotConfigurationModel from '../configuration/PlotConfigurationModel.js';
import YAxis from './YAxis.vue';

const PLOT_KEY = 'y-axis-leak-plot';

/**
 * Count listeners registered per event name on an eventemitter3 emitter.
 * @returns {Object<string, number>}
 */
function listenerCounts(emitter) {
  const counts = {};
  Object.keys(emitter._events ?? {}).forEach((event) => {
    const handlers = emitter._events[event];
    counts[event] = Array.isArray(handlers) ? handlers.length : 1;
  });

  return counts;
}

/**
 * Minimal stand-in for PlotSeries: YAxis only reads a few keys off it and
 * registers listeners on it.
 * @param {number} yAxisId
 */
function makeFakeSeries(yAxisId) {
  const values = {
    yAxisId,
    yKey: 'some-key',
    identifier: { namespace: '', key: 'y-axis-leak-telemetry' },
    color: { asHexString: () => '#ffffff' },
    name: 'Test Telemetry'
  };

  return {
    get: (key) => values[key],
    set: (key, value) => {
      values[key] = value;
    },
    on() {},
    off() {}
  };
}

describe('The YAxis component', () => {
  let openmct;
  let config;
  let plotObject;
  let telemetryObject;
  let element;

  beforeEach((done) => {
    openmct = createOpenMct();

    telemetryObject = {
      identifier: { namespace: '', key: 'y-axis-leak-telemetry' },
      type: 'test-object',
      name: 'Test Telemetry',
      telemetry: {
        values: [
          { key: 'utc', format: 'utc', name: 'Time', hints: { domain: 1 } },
          { key: 'some-key', name: 'Some attribute', hints: { range: 1 } }
        ]
      }
    };

    plotObject = {
      identifier: { namespace: '', key: PLOT_KEY },
      type: 'telemetry.plot.overlay',
      name: 'Leak Test Plot',
      composition: [],
      configuration: { series: [], yAxis: {}, xAxis: {} }
    };

    spyOn(openmct.telemetry, 'getMetadata').and.returnValue({
      valuesForHints: () => [{ key: 'some-key', name: 'Some attribute', unit: 'm' }],
      values: () => telemetryObject.telemetry.values
    });
    spyOn(openmct.telemetry, 'getFormatMap').and.returnValue({});

    config = new PlotConfigurationModel({
      id: PLOT_KEY,
      domainObject: plotObject,
      openmct
    });
    configStore.add(PLOT_KEY, config);

    element = document.createElement('div');
    document.body.appendChild(element);

    openmct.on('start', done);
    openmct.startHeadless();
  });

  afterEach(() => {
    configStore.deleteStore(PLOT_KEY);
    element.remove();

    return resetApplicationState(openmct);
  });

  function mountYAxis() {
    return mount(
      {
        components: { YAxis },
        provide: { openmct, domainObject: plotObject, objectPath: [plotObject] },
        template: '<YAxis :id="1" ref="root" />'
      },
      { element }
    );
  }

  it('releases its series-collection listeners when unmounted', async () => {
    const baseline = listenerCounts(config.series);

    for (let i = 0; i < 3; i++) {
      const { destroy } = mountYAxis();
      await nextTick();
      destroy();
      await nextTick();
    }

    // Mounting and unmounting must not accumulate listeners on the
    // long-lived SeriesCollection held by the ConfigStore.
    expect(listenerCounts(config.series)).toEqual(baseline);
  });

  it('does not retain a series after it is removed from the plot', async () => {
    const { vNode, destroy } = mountYAxis();
    await nextTick();

    const yAxisComponent = vNode.componentInstance.$refs.root;
    const series = makeFakeSeries(1);

    yAxisComponent.addSeries(series);
    expect(yAxisComponent._listeningTo.some((l) => l.object === series)).toBe(true);

    // A genuine removal from the plot must release the per-series listeners,
    // otherwise the mounted axis retains the dead series forever.
    yAxisComponent.seriesRemovedFromPlot(series);
    expect(yAxisComponent._listeningTo.some((l) => l.object === series)).toBe(false);

    destroy();
  });

  it('keeps listening to a series that only moved to another y-axis', async () => {
    const { vNode, destroy } = mountYAxis();
    await nextTick();

    const yAxisComponent = vNode.componentInstance.$refs.root;
    const series = makeFakeSeries(1);

    yAxisComponent.addSeries(series);

    // Move to y-axis 2. The axis must keep its change:yAxisId listener so it
    // can learn if the series comes back.
    series.set('yAxisId', 2);
    yAxisComponent.addOrRemoveSeries(series);
    expect(yAxisComponent._listeningTo.some((l) => l.object === series)).toBe(true);

    // Move back to y-axis 1 - the axis must pick it up again.
    series.set('yAxisId', 1);
    yAxisComponent.addOrRemoveSeries(series);
    expect(yAxisComponent.seriesModels).toContain(series);

    destroy();
  });
});
