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

import { ref } from 'vue';

/**
 * Manages alignment for multiple y axes given an object path
 * This is a Vue composition API utility function.
 * @param {Object} targetObject - The target to attach the event listener to.
 * @param {Array} path - The path of the target object.
 * @param {Object} openmct - The open mct API.
 */

const alignmentMap = {};

export function useAlignment(targetObject, path, openmct) {
  const getAlignmentKeyForPath = () => {
    const keys = Object.keys(alignmentMap);
    if (!keys.length) {
      return;
    }
    return (
      path
        //get just the identifiers
        .map((domainObject) => {
          return openmct.objects.makeKeyString(domainObject.identifier);
        })
        .reverse()
        // find a match
        .find((keyString) => {
          return keys.includes(keyString);
        })
    );
  };

  // Use the furthest ancestor's alignment if it exists, otherwise, use your own
  let alignmentKey = getAlignmentKeyForPath(path);

  if (!alignmentKey) {
    const targetObjectKey = openmct.objects.makeKeyString(targetObject.identifier);
    alignmentKey = targetObjectKey;
    alignmentMap[targetObjectKey] = ref({
      leftWidth: 0,
      rightWidth: 0,
      multiple: false,
      axes: {}
    });
  }

  // reset any alignment data for the given key
  const resetAlignment = () => {
    const key = getAlignmentKeyForPath(path);
    if (key && alignmentMap[key]) {
      delete alignmentMap[key];
    }
  };

  // Given the axes ids and widths, calculate the max left and right widths and whether or not multiple left axes exist
  const processAlignment = () => {
    const axesKeys = Object.keys(alignmentMap[alignmentKey].value.axes);
    const leftAxes = axesKeys.filter((axis) => axis <= 2);
    const rightAxes = axesKeys.filter((axis) => axis > 2);
    // Get width of left Y axis
    let leftWidth = 0;
    leftAxes.forEach((leftAxis) => {
      leftWidth = leftWidth + alignmentMap[alignmentKey].value.axes[leftAxis];
    });
    alignmentMap[alignmentKey].value.leftWidth = leftWidth;

    // Get width of right Y axis
    let rightWidth = 0;
    rightAxes.forEach((rightAxis) => {
      rightWidth = rightWidth + alignmentMap[alignmentKey].value.axes[rightAxis];
    });
    alignmentMap[alignmentKey].value.rightWidth = rightWidth;

    alignmentMap[alignmentKey].value.multiple = leftAxes.length > 1;
  };

  /**
   * Unregister y-axis from width calculations
   * @param {Object: yAxisId, updateObjectPath} the last known width of the y-axis, yAxisId of the tick bar, path of the axis being updated
   */
  const remove = ({ yAxisId, updateObjectPath, type } = {}) => {
    const key = getAlignmentKeyForPath(updateObjectPath);
    if (key) {
      if (alignmentMap[alignmentKey].value.axes[yAxisId] !== undefined) {
        delete alignmentMap[alignmentKey].value.axes[yAxisId];
      }
      processAlignment();
    }
  };

  /**
   * Update widths of a y axis given the id and path. The path is used to determine which ancestor should hold the alignment
   * @param {Object: width, yAxisId, updateObjectPath} the width of the y-axis, yAxisId of the tick bar, path of the axis being updated
   */
  const update = ({ width, yAxisId, updateObjectPath, type } = {}) => {
    const key = getAlignmentKeyForPath(updateObjectPath);
    if (key) {
      if (alignmentMap[alignmentKey].value.axes[yAxisId] === undefined) {
        alignmentMap[alignmentKey].value.axes[yAxisId] = width;
      } else if (width > alignmentMap[alignmentKey].value.axes[yAxisId]) {
        alignmentMap[alignmentKey].value.axes[yAxisId] = width;
      }
      processAlignment();
    }
  };

  return { alignment: alignmentMap[alignmentKey], update, remove, reset: resetAlignment };
}
