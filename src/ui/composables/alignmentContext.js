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
/* eslint-disable func-style */

import { reactive } from 'vue';

/** @type {Map<string, Alignment>} */
const alignmentMap = new Map();
/**
 * Manages alignment for multiple y axes given an object path.
 * This is a Vue composition API utility function.
 * @param {Object} targetObject - The target to attach the event listener to.
 * @param {ObjectPath} objectPath - The path of the target object.
 * @param {import('../../../openmct.js').OpenMCT} openmct - The open mct API.
 * @returns {Object} An object containing alignment data and methods to update, remove, and reset alignment.
 */
export function useAlignment(targetObject, objectPath, openmct) {
  /**
   * Get the alignment key for the given path.
   * @returns {string|undefined} The alignment key if found, otherwise undefined.
   */
  const getAlignmentKeyForPath = () => {
    const keys = Array.from(alignmentMap.keys());
    return objectPath
      .map((domainObject) => openmct.objects.makeKeyString(domainObject.identifier))
      .reverse()
      .find((keyString) => keys.includes(keyString));
  };

  // Use the furthest ancestor's alignment if it exists, otherwise, use your own
  let alignmentKey =
    getAlignmentKeyForPath() || openmct.objects.makeKeyString(targetObject.identifier);

  if (!alignmentMap.has(alignmentKey)) {
    alignmentMap.set(
      alignmentKey,
      reactive({
        leftWidth: 0,
        rightWidth: 0,
        multiple: false,
        axes: {}
      })
    );
  }

  /**
   * Reset any alignment data for the given key.
   */
  const reset = () => {
    const key = getAlignmentKeyForPath();
    if (key && alignmentMap.has(key)) {
      alignmentMap.delete(key);
    }
  };

  /**
   * Given the axes ids and widths, calculate the max left and right widths and whether or not multiple left axes exist.
   */
  const processAlignment = () => {
    const alignment = alignmentMap.get(alignmentKey);
    const axesKeys = Object.keys(alignment.axes);
    const leftAxes = axesKeys.filter((axis) => axis <= 2);
    const rightAxes = axesKeys.filter((axis) => axis > 2);

    alignment.leftWidth = leftAxes.reduce((sum, axis) => sum + (alignment.axes[axis] || 0), 0);
    alignment.rightWidth = rightAxes.reduce((sum, axis) => sum + (alignment.axes[axis] || 0), 0);
    alignment.multiple = leftAxes.length > 1;
  };

  /**
   * @typedef {Object} RemoveParams
   * @property {number} yAxisId - The ID of the y-axis to remove.
   * @property {ObjectPath} [updateObjectPath] - The path of the object to update.
   */

  /**
   * Unregister y-axis from width calculations.
   * @param {RemoveParams} param0 - The object containing yAxisId and updateObjectPath.
   */
  const remove = ({ yAxisId, updateObjectPath } = {}) => {
    const key = getAlignmentKeyForPath();
    if (key) {
      const alignment = alignmentMap.get(alignmentKey);
      if (alignment.axes[yAxisId] !== undefined) {
        delete alignment.axes[yAxisId];
      }
      processAlignment();
    }
  };

  /**
   * @typedef {Object} UpdateParams
   * @property {number} width - The width of the y-axis.
   * @property {number} yAxisId - The ID of the y-axis to update.
   * @property {ObjectPath} [updateObjectPath] - The path of the object to update.
   */

  /**
   * Update widths of a y axis given the id and path. The path is used to determine which ancestor should hold the alignment.
   * @param {UpdateParams} param0 - The object containing width, yAxisId, and updateObjectPath.
   */
  const update = ({ width, yAxisId, updateObjectPath } = {}) => {
    const key = getAlignmentKeyForPath();
    if (key) {
      const alignment = alignmentMap.get(alignmentKey);
      if (alignment.axes[yAxisId] === undefined || width > alignment.axes[yAxisId]) {
        alignment.axes[yAxisId] = width;
      }
      processAlignment();
    }
  };

  return { alignment: alignmentMap.get(alignmentKey), update, remove, reset };
}

/**
 * @typedef {import('../../api/objects/ObjectAPI.js').DomainObject[]} ObjectPath
 */

/**
 * @typedef {Object} Alignment
 * @property {number} leftWidth - The total width of the left axes.
 * @property {number} rightWidth - The total width of the right axes.
 * @property {boolean} multiple - Indicates if there are multiple left axes.
 * @property {Object.<string, number>} axes - A map of axis IDs to their widths.
 */
