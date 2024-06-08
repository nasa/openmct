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

import { onBeforeUnmount, ref } from 'vue';

/**
 * Registers an event listener on the specified target and automatically removes it when the
 * component is unmounted.
 * This is a Vue composition API utility function.
 * @param {EventTarget} path - The target to attach the event listener to.
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
    console.log('New alignment for: ', targetObjectKey, path);
    alignmentMap[targetObjectKey] = ref({
      leftWidth: 0,
      rightWidth: 0,
      multiple: false
    });
  }

  const resetAlignment = () => {
    const key = getAlignmentKeyForPath(path);
    console.log('resetting alignment');
    if (key && alignmentMap[key]) {
      delete alignmentMap[key];
    }
  };

  const update = ({ width, yAxisId, updateObjectPath, type } = {}) => {
    const key = getAlignmentKeyForPath(updateObjectPath);
    if (key) {
      // calculate the maxWidth here
      alignmentMap[alignmentKey].value.leftWidth = Math.max(
        width,
        alignmentMap[alignmentKey].value.leftWidth
      );
      console.log('updating', yAxisId, width, key, updateObjectPath[0].type);
    } else {
      console.log('not in path');
    }
  };

  if (path) {
    // Otherwise use lifecycle hooks to add/remove listener
    onBeforeUnmount(() => resetAlignment());
  }

  //watch this and update accordingly
  return { alignment: alignmentMap[alignmentKey], update };
}
