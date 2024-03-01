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
 * Module defining url handling.
 */

export function paramsToArray(openmct) {
  const urlParams = openmct.router.getParams();

  // Filter out any parameters whose values are objects, then map the rest to the desired string format.
  const newTabParams = Object.entries(urlParams).reduce((acc, [key, value]) => {
    // Only process the parameter if its value is not an object (or is null, which is fine to include).
    if (typeof value !== 'object' || value === null) {
      const param = `${key}=${encodeURIComponent(value)}`;
      acc.push(param);
    }
    return acc;
  }, []);

  return newTabParams;
}

export function identifierToString(openmct, objectPath) {
  return '#/browse/' + openmct.objects.getRelativePath(objectPath);
}

/**
 * @param {import('../../openmct').OpenMCT} openmct
 * @param {Array<import('../api/objects/ObjectAPI').DomainObject>} objectPath
 * @param {any} customUrlParams
 * @returns {string} url
 */
export function objectPathToUrl(openmct, objectPath, customUrlParams = {}) {
  let url = identifierToString(openmct, objectPath);

  let urlParams = paramsToArray(openmct, customUrlParams);
  if (urlParams.length) {
    url += '?' + urlParams.join('&');
  }

  return url;
}
