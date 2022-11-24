/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2022, United States Government
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

function getUrlParams(openmct, timeContext) {
    let urlParams = openmct.router.getParams();
    if (timeContext) {
        urlParams['tc.startDelta'] = timeContext.boundsVal.start;
        urlParams['tc.endDelta'] = timeContext.boundsVal.end;
    }

    return urlParams;
}

export function paramsToArray(openmct, timeContext) {
    // parse urlParams from an object to an array.
    let urlParams = getUrlParams(openmct, timeContext);
    let newTabParams = [];
    for (let key in urlParams) {
        if ({}.hasOwnProperty.call(urlParams, key)) {
            let param = `${key}=${urlParams[key]}`;
            newTabParams.push(param);
        }
    }

    return newTabParams;
}

export function identifierToString(openmct, objectPath) {
    return '#/browse/' + openmct.objects.getRelativePath(objectPath);
}

export default function objectPathToUrl(openmct, objectPath, timeContext) {
    let url = identifierToString(openmct, objectPath);
    let urlParams = paramsToArray(openmct, timeContext);
    if (urlParams.length) {
        url += '?' + urlParams.join('&');
    }

    return url;
}
