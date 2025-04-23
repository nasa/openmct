/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2025, United States Government
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
/* eslint-disable func-style */

import { reactive } from 'vue';

/** @type {Map<string, LineData> | null} */
const extendedLineMap = new Map();
/**
 * Manages line data given an timeline object.
 * This is a Vue composition API utility function.
 * @param {Object} targetObject - The target to that's consuming the useExtendedLines composable.
 * @param {ObjectPath} objectPath - The path of the target object.
 * @param {import('../../../openmct.js').OpenMCT} openmct - The open mct API.
 * @returns {Object} An object containing line data and methods to update, enable/disable, and reset extended line data.
 */
export function useExtendedLines(targetObject, objectPath, openmct) {
  /**
   * Get the key for the extended line given a path.
   * @returns {string|undefined} The key of the extended line if found, otherwise undefined.
   */
  const getTargetObjectKeyForPath = () => {
    const keys = Array.from(extendedLineMap.keys());
    return objectPath
      .map((domainObject) => openmct.objects.makeKeyString(domainObject.identifier))
      .reverse()
      .find((keyString) => keys.includes(keyString));
  };

  // Use the furthest ancestor's lineData if it exists, otherwise, use your own
  let targetObjectKey =
    getTargetObjectKeyForPath() || openmct.objects.makeKeyString(targetObject.identifier);

  if (!extendedLineMap.has(targetObjectKey)) {
    extendedLineMap.set(targetObjectKey, reactive({}));
  }

  /**
   * Reset any data for the given target object.
   */
  const reset = () => {
    const key = getTargetObjectKeyForPath();
    if (key && extendedLineMap.has(key)) {
      extendedLineMap.delete(key);
    }
  };

  /**
   * @typedef {Object} UpdateParams
   * @property {Array} lines - The line data to be updated.
   * @property {string} keyString - The domain object identifier of the telemetry object.
   */

  /**
   * Update line data given the keyString and path. The path is used to determine which ancestor should hold the lineData.
   * @param {UpdateParams} param0 - The array of lines, keyString.
   */
  const update = ({ lines, keyString } = {}) => {
    const key = getTargetObjectKeyForPath();
    if (key) {
      const lineData = extendedLineMap.get(key);
      if (lineData[keyString] === undefined) {
        lineData[keyString] = {};
      }
      lineData[keyString].lines = lines;
    }
  };

  /**
   * @typedef {Object} UpdateParams
   * @property {string} keyString - The domain object identifier of the telemetry object.
   * @property {string} id - The identifier of the line
   */

  /**
   * Update line data given the keyString and path. The path is used to determine which ancestor should hold the lineData.
   * @param {UpdateParams} param0 - The keyString and id.
   */
  const updateLineHover = ({ keyString, id, hoverEnabled } = {}) => {
    const key = getTargetObjectKeyForPath();
    if (key) {
      const lineData = extendedLineMap.get(key);
      if (lineData[keyString] !== undefined) {
        const lines = lineData[keyString].lines || [];
        let line = lines.find((lineItem) => {
          return lineItem.id === id;
        });
        if (line) {
          line.hoverEnabled = hoverEnabled === true;
        }
      }
    }
  };

  /**
   * @typedef {Object} RemoveParams
   * @property {string} keyString - The domain object identifier of the telemetry object.
   */

  /**
   * Unregister a telemetry object from line data.
   * @param keyString
   */
  const disable = (keyString) => {
    const key = getTargetObjectKeyForPath();
    if (key) {
      const lineData = extendedLineMap.get(key);
      if (lineData[keyString] !== undefined) {
        lineData[keyString].enabled = false;
      }
    }
  };

  /**
   * @typedef {Object} AddParams
   * @property {string} keyString - The domain object identifier of the telemetry object.
   */

  /**
   * Register a telemetry object to line data.
   * @param keyString
   */
  const enable = (keyString) => {
    const key = getTargetObjectKeyForPath();
    if (key) {
      const lineData = extendedLineMap.get(key);
      if (lineData[keyString] === undefined) {
        lineData[keyString] = {};
      }
      lineData[keyString].enabled = true;
    }
  };

  return {
    extendedLines: extendedLineMap.get(targetObjectKey),
    update,
    updateLineHover,
    enable,
    disable,
    reset
  };
}

/**
 * @typedef {import('../../api/objects/ObjectAPI.js').DomainObject[]} ObjectPath
 */

/**
 * @typedef {Object} LineData
 * @property {Map<string, {Object} boolean, Array.<Line>> keyString - The domain object identifier of the telemetry object (typically an event or command)
 */

/**
 * @typedef {Object} Line
 * @property {Number} x - the left offset
 * @property {string} limitClass - the class to apply to the line overlay
 * @property {string} id - the id of the line (typically a timestamp)
 * @property {boolean} hoverEnabled - whether the line is currently hovered on */
