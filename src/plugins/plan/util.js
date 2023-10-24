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

export function getValidatedData(domainObject) {
  const sourceMap = domainObject.sourceMap;
  const body = domainObject.selectFile?.body;
  let json = {};
  if (typeof body === 'string') {
    try {
      json = JSON.parse(body);
    } catch (e) {
      return json;
    }
  } else if (body !== undefined) {
    json = body;
  }

  if (
    sourceMap !== undefined &&
    sourceMap.activities !== undefined &&
    sourceMap.groupId !== undefined
  ) {
    let mappedJson = {};
    json[sourceMap.activities].forEach((activity) => {
      if (activity[sourceMap.groupId]) {
        const groupIdKey = activity[sourceMap.groupId];
        let groupActivity = {
          ...activity
        };

        if (sourceMap.start) {
          groupActivity.start = activity[sourceMap.start];
        }

        if (sourceMap.end) {
          groupActivity.end = activity[sourceMap.end];
        }

        if (!mappedJson[groupIdKey]) {
          mappedJson[groupIdKey] = [];
        }

        mappedJson[groupIdKey].push(groupActivity);
      }
    });

    return mappedJson;
  } else {
    return json;
  }
}

export function getContrastingColor(hexColor) {
  function cutHex(h, start, end) {
    const hStr = h.charAt(0) === '#' ? h.substring(1, 7) : h;

    return parseInt(hStr.substring(start, end), 16);
  }

  // https://codepen.io/davidhalford/pen/ywEva/
  const cThreshold = 130;

  if (hexColor.indexOf('#') === -1) {
    // We weren't given a hex color
    return '#ff0000';
  }

  const hR = cutHex(hexColor, 0, 2);
  const hG = cutHex(hexColor, 2, 4);
  const hB = cutHex(hexColor, 4, 6);

  const cBrightness = (hR * 299 + hG * 587 + hB * 114) / 1000;

  return cBrightness > cThreshold ? '#000000' : '#ffffff';
}
