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

import { MCT } from 'MCT';
import { markRaw } from 'vue';

let nativeFunctions = [];
let mockObjects = setMockObjects();

const EXAMPLE_ROLE = 'flight';
const DEFAULT_TIME_OPTIONS = {
  timeSystemKey: 'utc',
  bounds: {
    start: 0,
    end: 1
  }
};

/**
 * Creates an instance of Open MCT with the specified time system options.
 * @param {Object} [timeSystemOptions=DEFAULT_TIME_OPTIONS] - The time system options.
 * @returns {MCT} The created Open MCT instance.
 */
function createOpenMct(timeSystemOptions = DEFAULT_TIME_OPTIONS) {
  const openmct = markRaw(new MCT());
  openmct.install(openmct.plugins.LocalStorage());
  openmct.install(openmct.plugins.UTCTimeSystem());
  openmct.setAssetPath('/base');
  openmct.user.setActiveRole(EXAMPLE_ROLE);

  const timeSystemKey = timeSystemOptions.timeSystemKey;
  const start = timeSystemOptions.bounds.start;
  const end = timeSystemOptions.bounds.end;

  openmct.time.setTimeSystem(timeSystemKey, {
    start,
    end
  });

  return openmct;
}

/**
 * Creates a new MouseEvent with the specified event name.
 * @param {string} eventName - The name of the event.
 * @returns {MouseEvent} The created MouseEvent.
 */
function createMouseEvent(eventName) {
  return new MouseEvent(eventName, {
    bubbles: true,
    cancelable: true,
    view: window
  });
}

/**
 * Spies on built-in functions.
 *
 * @param {Array<string>} functionNames - An array of function names to spy on.
 * @param {Object} [object=window] - The object on which the functions are defined (default is the global `window` object).
 * @throws {string} If a built-in spy function is already defined for a function name.
 */
function spyOnBuiltins(functionNames, object = window) {
  functionNames.forEach((functionName) => {
    if (nativeFunctions[functionName]) {
      throw `Builtin spy function already defined for ${functionName}`;
    }

    nativeFunctions.push({
      functionName,
      object,
      nativeFunction: object[functionName]
    });
    spyOn(object, functionName);
  });
}

/**
 * Clears the built-in spies by restoring the original functions.
 * @param {Object[]} nativeFunctions - The array of native functions to clear.
 */
function clearBuiltinSpies() {
  nativeFunctions.forEach(clearBuiltinSpy);
  nativeFunctions = [];
}

/**
 * Resets the application state by clearing built-in spies and destroying the openmct instance.
 * If the window location hash is not empty, it will reset the hash and resolve the promise after the hash change event.
 * If the window location hash is empty, it will immediately resolve the promise.
 * @param {Object} openmct - The openmct instance to destroy (optional).
 * @returns {Promise} A promise that resolves after the application state has been reset.
 */
function resetApplicationState(openmct) {
  let promise;

  clearBuiltinSpies();

  if (openmct !== undefined) {
    openmct.destroy();
  }

  if (window.location.hash !== '#' && window.location.hash !== '') {
    promise = new Promise((resolve, reject) => {
      window.addEventListener('hashchange', cleanup);
      window.location.hash = '#';

      function cleanup() {
        window.removeEventListener('hashchange', cleanup);
        resolve();
      }
    });
  } else {
    promise = Promise.resolve();
  }

  return promise;
}

/**
 * Simulates a keyboard event.
 * @param {Object} opts - The options for the keyboard event.
 * @param {string} opts.key - The key value of the event.
 * @param {HTMLElement} [opts.element=document] - The element to dispatch the event on.
 * @param {number} [opts.keyCode] - The key code of the event.
 * @param {string} [opts.type='keydown'] - The type of the event.
 */
function simulateKeyEvent(opts) {
  if (!opts.key) {
    console.warn('simulateKeyEvent needs a key');
    return;
  }

  const el = opts.element || document;
  const key = opts.key;
  const keyCode = opts.keyCode || key;
  const type = opts.type || 'keydown';
  const event = new Event(type);

  event.keyCode = keyCode;
  event.key = key;

  el.dispatchEvent(event);
}

/**
 * Restores the original implementation of a built-in function by assigning the native function back to the object.
 * @param {Object} funcDefinition - The definition of the built-in function.
 */
function clearBuiltinSpy(funcDefinition) {
  funcDefinition.object[funcDefinition.functionName] = funcDefinition.nativeFunction;
}

/**
 * Get the latest telemetry data from an array of telemetry objects.
 * @param {Object[]} telemetry - The array of telemetry objects.
 * @param {Object} opts - Options for getting the latest telemetry.
 * @param {string} [opts.timeFormat='utc'] - The time format to use for comparison.
 * @returns {Object} The latest telemetry object.
 */
function getLatestTelemetry(telemetry = [], opts = {}) {
  let latest = [];
  let timeFormat = opts.timeFormat || 'utc';

  if (telemetry.length) {
    latest = telemetry.reduce((prev, cur) => {
      return prev[timeFormat] > cur[timeFormat] ? prev : cur;
    });
  }

  return latest;
}

/**
 * Generates mock objects based on the provided options.
 * @param {Object} opts - Options for generating mock objects.
 * @param {string} [opts.type='default'] - The type of mock objects to generate.
 * @param {string[]} [opts.objectKeyStrings] - The object keys to include in the mock objects.
 * @param {Object} [opts.telemetryConfig] - Configuration for customizing the telemetry data in the mock objects.
 * @param {string[]} [opts.telemetryConfig.keys] - The keys to include in the telemetry data.
 * @param {string} [opts.telemetryConfig.format='utc'] - The format of the telemetry data.
 * @param {Object} [opts.telemetryConfig.hints] - The hints for each telemetry key.
 * @param {Object} [opts.overwrite] - Object containing fields to overwrite in the generated mock objects.
 * @returns {Object} The generated mock objects.
 * @throws {string} Throws an error if the optional parameter "objectKeyStrings" is provided but is not an array of string object keys.
 * @throws {string} Throws an error if no mock object is found for a given object key and type.
 * @example
 * getMockObjects({
 *     name: 'Jamie Telemetry',
 *     keys: ['test','other','yeah','sup'],
 *     format: 'local',
 *     telemetryConfig: {
 *         hints: {
 *             test: {
 *                 domain: 1
 *             },
 *             other: {
 *                 range: 2
 *             }
 *         }
 *     }
 * })
 *
 */
function getMockObjects(opts = {}) {
  opts.type = opts.type || 'default';
  if (opts.objectKeyStrings && !Array.isArray(opts.objectKeyStrings)) {
    throw `"getMockObjects" optional parameter "objectKeyStrings" must be an array of string object keys`;
  }

  let requestedMocks = {};

  if (!opts.objectKeyStrings) {
    requestedMocks = copyObj(mockObjects[opts.type]);
  } else {
    opts.objectKeyStrings.forEach((objKey) => {
      if (mockObjects[opts.type] && mockObjects[opts.type][objKey]) {
        requestedMocks[objKey] = copyObj(mockObjects[opts.type][objKey]);
      } else {
        throw `No mock object for object key "${objKey}" of type "${opts.type}"`;
      }
    });
  }

  // build out custom telemetry mappings if necessary
  if (requestedMocks.telemetry && opts.telemetryConfig) {
    let keys = opts.telemetryConfig.keys;
    let format = opts.telemetryConfig.format || 'utc';
    let hints = opts.telemetryConfig.hints;
    let values;

    // if utc, keep default
    if (format === 'utc') {
      // save for later if new keys
      if (keys) {
        format = requestedMocks.telemetry.telemetry.values.find((vals) => vals.key === 'utc');
      }
    } else {
      format = {
        key: format,
        name: 'Time',
        format: format === 'local' ? 'local-format' : format,
        hints: {
          domain: 1
        }
      };
    }

    if (keys) {
      values = keys.map((key) => ({
        key,
        name: key + ' attribute'
      }));
      values.push(format); // add time format back in
    } else {
      values = requestedMocks.telemetry.telemetry.values;
    }

    if (hints) {
      for (let val of values) {
        if (hints[val.key]) {
          val.hints = hints[val.key];
        }
      }
    }

    requestedMocks.telemetry.telemetry.values = values;
  }

  // overwrite any field keys
  if (opts.overwrite) {
    for (let mock in requestedMocks) {
      if (opts.overwrite[mock]) {
        requestedMocks[mock] = Object.assign(requestedMocks[mock], opts.overwrite[mock]);
      }
    }
  }

  return requestedMocks;
}

/**
 * Generates mock telemetry data.
 * @param {Object} opts - Options for generating mock telemetry.
 * @param {number} [opts.count=2] - The number of telemetry data points to generate.
 * @param {string} [opts.format='utc'] - The format of the telemetry data.
 * @param {string} [opts.name='Mock Telemetry Datum'] - The name of the telemetry data.
 * @param {string[]} [opts.keys] - The keys to include in the telemetry data.
 * @param {number} [opts.keyCount] - The number of keys to include in the telemetry data.
 * @returns {Object[]} An array of mock telemetry data points.
 */
function getMockTelemetry(opts = {}) {
  let count = opts.count || 2;
  let format = opts.format || 'utc';
  let name = opts.name || 'Mock Telemetry Datum';
  let keyCount = 2;
  let keys = false;
  let telemetry = [];

  if (opts.keys && Array.isArray(opts.keys)) {
    keyCount = opts.keys.length;
    keys = opts.keys;
  } else if (opts.keyCount) {
    keyCount = opts.keyCount;
  }

  for (let i = 1; i < count + 1; i++) {
    let datum = {
      [format]: i,
      name
    };

    for (let k = 1; k < keyCount + 1; k++) {
      let key = keys ? keys[k - 1] : 'some-key-' + k;
      let value = keys ? keys[k - 1] + ' value ' + i : 'some value ' + i + '-' + k;
      datum[key] = value;
    }

    telemetry.push(datum);
  }

  return telemetry;
}

// used to inject into tests that require a render
function renderWhenVisible(func) {
  func();
  return true;
}

// copy objects a bit more easily
function copyObj(obj) {
  return JSON.parse(JSON.stringify(obj));
}

// add any other necessary types to this mockObjects object
function setMockObjects() {
  return {
    default: {
      folder: {
        identifier: {
          namespace: '',
          key: 'folder-object'
        },
        name: 'Test Folder Object',
        type: 'folder',
        composition: [],
        location: 'mine'
      },
      ladTable: {
        identifier: {
          namespace: '',
          key: 'lad-object'
        },
        type: 'LadTable',
        composition: []
      },
      ladTableSet: {
        identifier: {
          namespace: '',
          key: 'lad-set-object'
        },
        type: 'LadTableSet',
        composition: []
      },
      telemetry: {
        identifier: {
          namespace: '',
          key: 'telemetry-object'
        },
        type: 'test-telemetry-object',
        name: 'Test Telemetry Object',
        telemetry: {
          values: [
            {
              key: 'name',
              name: 'Name',
              format: 'string'
            },
            {
              key: 'utc',
              name: 'Time',
              format: 'utc',
              hints: {
                domain: 1
              }
            },
            {
              name: 'Some attribute 1',
              key: 'some-key-1',
              hints: {
                range: 1
              }
            },
            {
              name: 'Some attribute 2',
              key: 'some-key-2'
            }
          ]
        }
      }
    },
    otherType: {
      example: {}
    }
  };
}

export {
  clearBuiltinSpies,
  createMouseEvent,
  createOpenMct,
  getLatestTelemetry,
  getMockObjects,
  getMockTelemetry,
  renderWhenVisible,
  resetApplicationState,
  simulateKeyEvent,
  spyOnBuiltins
};
