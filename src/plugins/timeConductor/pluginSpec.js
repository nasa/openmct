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

import { createMouseEvent, createOpenMct, resetApplicationState } from 'utils/testing';
import Vue from 'vue';

import { FIXED_MODE_KEY } from '../../api/time/constants';
import { getPreciseDuration, millisecondsToDHMS } from '../../utils/duration';
import ConductorPlugin from './plugin';

const THIRTY_SECONDS = 30 * 1000;
const ONE_MINUTE = THIRTY_SECONDS * 2;
const FIVE_MINUTES = ONE_MINUTE * 5;
const FIFTEEN_MINUTES = FIVE_MINUTES * 3;
const THIRTY_MINUTES = FIFTEEN_MINUTES * 2;
const date = new Date(Date.UTC(78, 0, 20, 0, 0, 0)).getTime();

describe('time conductor', () => {
  let element;
  let child;
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
        presets: [],
        records: 2
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
    element = document.createElement('div');
    element.style.width = '640px';
    element.style.height = '480px';
    child = document.createElement('div');
    child.style.width = '640px';
    child.style.height = '480px';
    element.appendChild(child);

    openmct.on('start', () => {
      openmct.time.setMode(FIXED_MODE_KEY, {
        start: config.menuOptions[0].bounds.start,
        end: config.menuOptions[0].bounds.end
      });
      Vue.nextTick(() => {
        done();
      });
    });
    appHolder = document.createElement('div');
    openmct.start(appHolder);
  });

  afterEach(() => {
    appHolder = undefined;
    openmct = undefined;

    return resetApplicationState(openmct);
  });

  describe('in fixed time mode', () => {
    it('shows delta inputs', () => {
      const fixedModeEl = appHolder.querySelector('.is-fixed-mode');
      const dateTimeInputs = fixedModeEl.querySelectorAll('.c-compact-tc__setting-value__elem');
      expect(dateTimeInputs[0].innerHTML.trim()).toEqual('Fixed Timespan');
      expect(dateTimeInputs[1].innerHTML.trim()).toEqual('Local Clock');
      expect(dateTimeInputs[2].innerHTML.trim()).toEqual('UTC');
      const dateTimes = fixedModeEl.querySelectorAll('.c-compact-tc__setting-value');
      expect(dateTimes[1].innerHTML.trim()).toEqual('1978-01-19 23:30:00.000Z');
      expect(dateTimes[2].innerHTML.trim()).toEqual('1978-01-20 00:00:00.000Z');
    });
  });

  describe('in realtime mode', () => {
    beforeEach(async () => {
      openmct.time.setClockOffsets({
        start: -THIRTY_MINUTES,
        end: THIRTY_SECONDS
      });

      const switcher = appHolder.querySelector('.is-fixed-mode');
      const clickEvent = createMouseEvent('click');
      switcher.dispatchEvent(clickEvent);
      await Vue.nextTick();
      const modeButton = switcher.querySelector('.c-tc-input-popup .c-button--menu');
      const clickEvent1 = createMouseEvent('click');
      modeButton.dispatchEvent(clickEvent1);
      await Vue.nextTick();
      const clockItem = document.querySelectorAll(
        '.c-conductor__mode-menu .c-super-menu__menu li'
      )[1];
      const clickEvent2 = createMouseEvent('click');
      clockItem.dispatchEvent(clickEvent2);
      await Vue.nextTick();
      await Vue.nextTick();
    });

    it('shows delta inputs', () => {
      const realtimeModeEl = appHolder.querySelector('.is-realtime-mode');
      const dateTimeInputs = realtimeModeEl.querySelectorAll('.c-compact-tc__setting-value__elem');
      expect(dateTimeInputs[0].innerHTML.trim()).toEqual('Real-Time');

      const dateTimes = realtimeModeEl.querySelectorAll('.c-compact-tc__setting-value');
      expect(dateTimes[1].innerHTML.replace(/[^(\d|:)]/g, '')).toEqual('00:30:00');
      expect(dateTimes[2].innerHTML.replace(/[^(\d|:)]/g, '')).toEqual('00:00:30');
    });

    it('shows clock options', () => {
      const realtimeModeEl = appHolder.querySelector('.is-realtime-mode');
      const dateTimeInputs = realtimeModeEl.querySelectorAll('.c-compact-tc__setting-value__elem');
      expect(dateTimeInputs[1].innerHTML.trim()).toEqual('Local Clock');
    });

    it('shows the current time', () => {
      const realtimeModeEl = appHolder.querySelector('.is-realtime-mode');
      const currentTimeEl = realtimeModeEl.querySelector('.c-compact-tc__current-update');
      const currentTime = openmct.time.clock().currentValue();
      const { start, end } = openmct.time.bounds();

      expect(currentTime).toBeGreaterThan(start);
      expect(currentTime).toBeLessThanOrEqual(end);
      expect(currentTimeEl.innerHTML.trim().length).toBeGreaterThan(0);
    });
  });
});

describe('duration functions', () => {
  it('should transform milliseconds to DHMS', () => {
    const functionResults = [
      millisecondsToDHMS(0),
      millisecondsToDHMS(86400000),
      millisecondsToDHMS(129600000),
      millisecondsToDHMS(661824000),
      millisecondsToDHMS(213927028)
    ];
    const validResults = [' ', '+ 1d', '+ 1d 12h', '+ 7d 15h 50m 24s', '+ 2d 11h 25m 27s 28ms'];
    expect(validResults).toEqual(functionResults);
  });

  it('should get precise duration', () => {
    const functionResults = [
      getPreciseDuration(0),
      getPreciseDuration(643680000),
      getPreciseDuration(1605312000),
      getPreciseDuration(213927028)
    ];
    const validResults = [
      '00:00:00:00:000',
      '07:10:48:00:000',
      '18:13:55:12:000',
      '02:11:25:27:028'
    ];
    expect(validResults).toEqual(functionResults);
  });
});
