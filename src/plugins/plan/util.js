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

/**
 * The SourceMap allows mapping specific implementations of plan domain objects to those expected by Open MCT.
 * @typedef {object} SourceMapOption
 * @property {string} orderedGroups the property of the plan that lists groups/swim lanes specifying what order they will be displayed in Open MCT.
 * @property {string} activities the property of the plan that has the list of activities to be displayed.
 * @property {string} groupId the property of the activity that maps to the group/swim lane it should be displayed in.
 * @property {string} start The start time property of the activity
 * @property {string} end The end time property of the activity
 * @property {string} id The unique id of the activity. This is required to allow setting activity states
 * @property {object} displayProperties a list of key: value pairs that specifies which properties of the activity should be displayed when it is selected. Ex. {'location': 'Location', 'metadata.length_in_meters', 'Length (meters)'}
 */

import _ from 'lodash';
export function getValidatedData(domainObject) {
  const sourceMap = domainObject.sourceMap;
  const json = getObjectJson(domainObject);

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

        if (Array.isArray(sourceMap.filterMetadata)) {
          groupActivity.filterMetadataValues = [];
          sourceMap.filterMetadata.forEach((property) => {
            const value = _.get(activity, property);
            groupActivity.filterMetadataValues.push({
              value
            });
          });
        }

        if (sourceMap.id) {
          groupActivity.id = activity[sourceMap.id];
        }

        if (sourceMap.displayProperties) {
          groupActivity.displayProperties = sourceMap.displayProperties;
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

function getObjectJson(domainObject) {
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

  return json;
}

export function getValidatedGroups(domainObject, planData) {
  let orderedGroupNames;
  const sourceMap = domainObject.sourceMap;
  const json = getObjectJson(domainObject);
  if (sourceMap?.orderedGroups) {
    const groups = json[sourceMap.orderedGroups];
    if (groups.length && typeof groups[0] === 'object') {
      //if groups is a list of objects, then get the name property from each group object.
      const groupsWithNames = groups.filter(
        (groupObj) => groupObj.name !== undefined && groupObj.name !== ''
      );
      orderedGroupNames = groupsWithNames.map((groupObj) => groupObj.name);
    } else {
      // Otherwise, groups is likely a list of names, so use that.
      orderedGroupNames = groups;
    }
  }
  if (orderedGroupNames === undefined) {
    orderedGroupNames = Object.keys(planData);
  }

  return orderedGroupNames;
}

export function getDisplayProperties(activity) {
  let displayProperties = {};
  function extractProperties(properties, useKeyAsLabel = false) {
    Object.keys(properties).forEach((key) => {
      const label = useKeyAsLabel ? key : properties[key];
      const value = _.get(activity, key);
      if (value) {
        displayProperties[key] = { label, value };
      }
    });
  }

  if (activity?.displayProperties) {
    extractProperties(activity.displayProperties);
  } else if (activity?.properties) {
    extractProperties(activity.properties, true);
  }
  return displayProperties;
}

export function getFilteredValues(activity) {
  let values = [];
  if (Array.isArray(activity.filterMetadataValues)) {
    values = activity.filterMetadataValues;
  } else if (activity?.properties) {
    values = Object.values(activity.properties);
  }

  return values;
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
