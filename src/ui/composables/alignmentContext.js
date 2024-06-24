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

/**
 * Manages alignment for multiple y axes given an object path
 * This is a Vue composition API utility function.
 * @param {Object} targetObject - The target to attach the event listener to.
 * @param {Array} path - The path of the target object.
 * @param {Object} openmct - The open mct API.
 */

const alignmentMap = new Map();

export function useAlignment(targetObject, path, openmct) {
  const getAlignmentKeyForPath = () => {
    const keys = Array.from(alignmentMap.keys());
    return path
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

  // Reset any alignment data for the given key
  const resetAlignment = () => {
    const key = getAlignmentKeyForPath();
    if (key && alignmentMap.has(key)) {
      alignmentMap.delete(key);
    }
  };

  // Given the axes ids and widths, calculate the max left and right widths and whether or not multiple left axes exist
  const processAlignment = () => {
    const alignment = alignmentMap.get(alignmentKey);
    const axesKeys = Object.keys(alignment.axes);
    const leftAxes = axesKeys.filter((axis) => axis <= 2);
    const rightAxes = axesKeys.filter((axis) => axis > 2);

    alignment.leftWidth = leftAxes.reduce((sum, axis) => sum + alignment.axes[axis], 0);
    alignment.rightWidth = rightAxes.reduce((sum, axis) => sum + alignment.axes[axis], 0);
    alignment.multiple = leftAxes.length > 1;
  };

  /**
   * Unregister y-axis from width calculations
   * @param {Object} param0 - The object containing yAxisId, updateObjectPath, and type.
   */
  const remove = ({ yAxisId, updateObjectPath } = {}) => {
    const key = getAlignmentKeyForPath(updateObjectPath);
    if (key) {
      const alignment = alignmentMap.get(alignmentKey);
      if (alignment.axes[yAxisId] !== undefined) {
        delete alignment.axes[yAxisId];
      }
      processAlignment();
    }
  };

  /**
   * Update widths of a y axis given the id and path. The path is used to determine which ancestor should hold the alignment
   * @param {Object} param0 - The object containing width, yAxisId, updateObjectPath, and type.
   */
  const update = ({ width, yAxisId, updateObjectPath } = {}) => {
    const key = getAlignmentKeyForPath(updateObjectPath);
    if (key) {
      const alignment = alignmentMap.get(alignmentKey);
      if (alignment.axes[yAxisId] === undefined || width > alignment.axes[yAxisId]) {
        alignment.axes[yAxisId] = width;
      }
      processAlignment();
    }
  };

  return { alignment: alignmentMap.get(alignmentKey), update, remove, reset: resetAlignment };
}
