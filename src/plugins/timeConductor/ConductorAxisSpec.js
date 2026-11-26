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

import { scaleUtc } from 'd3-scale';
import { createOpenMct, resetApplicationState } from 'utils/testing';
import { nextTick } from 'vue';

import { FIXED_MODE_KEY } from '../../api/time/constants.js';
import ConductorPlugin from './plugin.js';

const THIRTY_SECONDS = 30 * 1000;
const ONE_MINUTE = THIRTY_SECONDS * 2;
const FIVE_MINUTES = ONE_MINUTE * 5;
const FIFTEEN_MINUTES = FIVE_MINUTES * 3;
const THIRTY_MINUTES = FIFTEEN_MINUTES * 2;
const date = new Date(Date.UTC(78, 0, 20, 0, 0, 0)).getTime();

// Must match PIXELS_PER_TICK in ConductorAxis.vue
const PIXELS_PER_TICK = 100;
// The axis spans the full app holder width. Below 300px the configured tick
// density and d3's default density resolve to different tick intervals for a
// thirty minute domain, so a stale configuration is detectable.
const NARROW_APP_WIDTH = 280;
const WIDE_APP_WIDTH = 1600;

describe('the time conductor axis in fixed timespan mode', () => {
  let appHolder;
  let openmct;
  let config = {
    menuOptions: [
      {
        name: 'FixedTimeRange',
        timeSystem: 'utc',
        bounds: {
          start: date - THIRTY_MINUTES,
          end: date
        },
        presets: []
      },
      {
        name: 'LocalClock',
        timeSystem: 'utc',
        clock: 'local',
        clockOffsets: {
          start: -THIRTY_MINUTES,
          end: THIRTY_SECONDS
        },
        presets: []
      }
    ]
  };

  beforeEach((done) => {
    openmct = createOpenMct();
    openmct.install(new ConductorPlugin(config));

    appHolder = document.createElement('div');
    appHolder.style.width = `${NARROW_APP_WIDTH}px`;
    appHolder.style.height = '480px';
    document.body.appendChild(appHolder);

    openmct.on('start', () => {
      openmct.time.setMode(FIXED_MODE_KEY, {
        start: config.menuOptions[0].bounds.start,
        end: config.menuOptions[0].bounds.end
      });
      nextTick(() => {
        done();
      });
    });
    openmct.start(appHolder);
  });

  afterEach(() => {
    document.body.removeChild(appHolder);
    appHolder = undefined;

    return resetApplicationState(openmct);
  });

  function waitForRender() {
    return new Promise((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(resolve);
      });
    });
  }

  function getAxisElement() {
    return appHolder.querySelector('.c-conductor-axis');
  }

  function getTickCount() {
    return getAxisElement().querySelectorAll('g.tick').length;
  }

  it('renders the tick density configured for the axis width', async () => {
    await waitForRender();

    const axisElement = getAxisElement();
    expect(axisElement).not.toBeNull();

    const axisWidth = axisElement.clientWidth;
    // Keeps the test inside the width window where a stale tick
    // configuration is distinguishable; tune NARROW_APP_WIDTH if it trips.
    expect(axisWidth).toBeGreaterThan(PIXELS_PER_TICK);
    expect(axisWidth).toBeLessThan(300);

    const expectedTickCount = scaleUtc()
      .domain([
        new Date(config.menuOptions[0].bounds.start),
        new Date(config.menuOptions[0].bounds.end)
      ])
      .ticks(axisWidth / PIXELS_PER_TICK).length;
    expect(getTickCount()).toEqual(expectedTickCount);
  });

  it('renders more ticks after the axis grows wider', async () => {
    await waitForRender();
    const narrowTickCount = getTickCount();

    appHolder.style.width = `${WIDE_APP_WIDTH}px`;
    await waitForRender();
    await waitForRender();

    const wideTickCount = getTickCount();
    expect(wideTickCount).toBeGreaterThan(narrowTickCount);
  });
});
