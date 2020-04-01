/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2020, United States Government
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

export const computeCondition = (resultMap, allMustBeTrue) => {
    let result = false;
    for (let key in resultMap) {
        if (resultMap.hasOwnProperty(key)) {
            result = resultMap[key];
            if (allMustBeTrue && !result) {
                //If we want all conditions to be true, then even one negative result should break.
                break;
            } else if (!allMustBeTrue && result) {
                //If we want at least one condition to be true, then even one positive result should break.
                break;
            }
        }
    }
    return result;
};

//Returns true only if limit number of results are satisfied
export const computeConditionByLimit = (resultMap, limit) => {
    let trueCount = 0;
    for (let key in resultMap) {
        if (resultMap.hasOwnProperty(key)) {
            if (resultMap[key]) {
                trueCount++;
            }
            if (trueCount > limit) {
                break;
            }
        }
    }
    return trueCount === limit;
};
