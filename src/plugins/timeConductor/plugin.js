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

import { markRaw } from 'vue';

import { FIXED_MODE_KEY, REALTIME_MODE_KEY } from '../../api/time/constants.js';
import Conductor from './ConductorComponent.vue';

function isTruthy(a) {
  return Boolean(a);
}

function validateMenuOption(menuOption, index) {
  if (menuOption.clock && !menuOption.clockOffsets) {
    return `Conductor menu option is missing required property 'clockOffsets'. This field is required when configuring a menu option with a clock.\r\n${JSON.stringify(
      menuOption
    )}`;
  }

  if (!menuOption.timeSystem) {
    return `Conductor menu option is missing required property 'timeSystem'\r\n${JSON.stringify(
      menuOption
    )}`;
  }

  if (!menuOption.bounds && !menuOption.clock) {
    return `Conductor menu option is missing required property 'bounds'. This field is required when configuring a menu option with fixed bounds.\r\n${JSON.stringify(
      menuOption
    )}`;
  }
}

function hasRequiredOptions(config) {
  if (config === undefined || config.menuOptions === undefined || config.menuOptions.length === 0) {
    return "You must specify one or more 'menuOptions'.";
  }

  if (config.menuOptions.some(validateMenuOption)) {
    return config.menuOptions.map(validateMenuOption).filter(isTruthy).join('\n');
  }

  return undefined;
}

function validateConfiguration(config, openmct) {
  const systems = openmct.time.getAllTimeSystems().reduce(function (m, ts) {
    m[ts.key] = ts;

    return m;
  }, {});
  const clocks = openmct.time.getAllClocks().reduce(function (m, c) {
    m[c.key] = c;

    return m;
  }, {});

  return config.menuOptions
    .map(function (menuOption) {
      let message = '';
      if (menuOption.timeSystem && !systems[menuOption.timeSystem]) {
        message = `Time system '${
          menuOption.timeSystem
        }' has not been registered: \r\n ${JSON.stringify(menuOption)}`;
      }

      if (menuOption.clock && !clocks[menuOption.clock]) {
        message = `Clock '${menuOption.clock}' has not been registered: \r\n ${JSON.stringify(
          menuOption
        )}`;
      }

      return message;
    })
    .filter(isTruthy)
    .join('\n');
}

function throwIfError(configResult) {
  if (configResult) {
    throw new Error(
      `Invalid Time Conductor Configuration. ${configResult} \r\n https://github.com/nasa/openmct/blob/master/API.md#the-time-conductor`
    );
  }
}

function mountComponent(openmct, configuration) {
  const conductorApp = {
    components: {
      Conductor
    },
    provide: {
      openmct: openmct,
      configuration: configuration
    },
    template: '<Conductor />'
  };
  openmct.layout.conductorComponent = markRaw(conductorApp);
}

/**
 * @param {TimeConductorConfig} config
 * @returns {Function} install the function to install the time conductor plugin
 */
export default function (config) {
  return function install(openmct) {
    let configResult = hasRequiredOptions(config) || validateConfiguration(config, openmct);
    throwIfError(configResult);

    const defaults = config.menuOptions[0];
    const defaultClock = defaults.clock;
    const defaultMode = defaultClock ? REALTIME_MODE_KEY : FIXED_MODE_KEY;
    const defaultBounds = defaults?.bounds;
    let clockOffsets = openmct.time.getClockOffsets();

    if (defaultClock) {
      openmct.time.setClock(defaults.clock);
      clockOffsets = defaults.clockOffsets;
    } else {
      // always have an active clock, regardless of mode
      const firstClock = config.menuOptions.find((option) => option.clock);

      if (firstClock) {
        openmct.time.setClock(firstClock.clock);
        clockOffsets = firstClock.clockOffsets;
      }
    }

    openmct.time.setMode(defaultMode, defaultClock ? clockOffsets : defaultBounds);
    openmct.time.setTimeSystem(defaults.timeSystem, defaultBounds);

    //We are going to set the clockOffsets in fixed time mode since the conductor components down the line need these
    if (clockOffsets && defaultMode === FIXED_MODE_KEY) {
      openmct.time.setClockOffsets(clockOffsets);
    }
    //We are going to set the fixed time bounds in realtime time mode since the conductor components down the line need these
    if (defaultBounds && defaultMode === REALTIME_MODE_KEY) {
      openmct.time.setBounds(clockOffsets);
    }

    openmct.on('start', function () {
      mountComponent(openmct, config);
    });
  };
}

/**
 * @typedef {Object} TimeConductorConfig
 * @property {MenuOptions} menuOptions
 * @property {number?} throttleRate the rate in milliseconds in which to throttle time conductor visual updates
 * @property {number?} records the maximum number of records to keep in the history
 */

/**
 * @typedef {Array<FixedMenuOption | RealtimeMenuOption>} MenuOptions
 */

/**
 * @typedef {Object} FixedMenuOption
 * @property {string?} name the name of this option
 * @property {string} timeSystem the key of the time system to use for this option
 * @property {TimeConductorBounds} bounds the starting bounds for this option
 * @deprecated {number?} records use {@link TimeConductorConfig.records} instead
 * @property {number?} limit
 * @property {Array<FixedPreset>} presets
 */

/**
 * @typedef {Object} RealtimeMenuOption
 * @property {string?} name the name of this option
 * @property {string} timeSystem the key of the time system for this option
 * @property {string} clock the key of the clock for this option
 * @property {ClockOffsets} clockOffsets the starting bounds for this option
 * @property {Array<RealtimePreset>} presets
 */

/**
 * Commonly used fixed bounds can be preloaded for convenient re-use (ie. Yesterday, Mission Time, etc.)
 * @typedef {Object} FixedPreset
 * @property {string} label the display label for this preset
 * @property {TimeConductorBounds} bounds the bounds for this preset
 */

/**
 * Commonly used realtime offsets can be preloaded for convenient re-use (ie. 1 hour, 15 minutes, etc.)
 * @typedef {Object} RealtimePreset
 * @property {string} label the display label for this preset
 * @property {ClockOffsets} clockOffsets the clock offsets for this preset
 * @deprecated {TimeConductorBounds} bounds use {@link RealtimePreset.clockOffsets} instead
 */

/**
 * @typedef {import('../../api/time/TimeContext').TimeConductorBounds} TimeConductorBounds
 * @typedef {import('../../api/time/TimeContext').ClockOffsets} ClockOffsets
 */
