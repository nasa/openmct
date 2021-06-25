/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2021, United States Government
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

const ONE_MINUTE = 60 * 1000;
const ONE_HOUR = ONE_MINUTE * 60;
const ONE_DAY = ONE_HOUR * 24;

function normalizeAge(num) {
    const hundredtized = num * 100;
    const isWhole = hundredtized % 100 === 0;

    return isWhole ? hundredtized / 100 : num;
}

function toDoubleDigits(num) {
    if (num >= 10) {
        return num;
    } else {
        return `0${num}`;
    }
}

export function getDuration(numericDuration) {
    let result;
    let age;

    if (numericDuration > ONE_DAY - 1) {
        age = normalizeAge((numericDuration / ONE_DAY)).toFixed(2);
        result = `+ ${age} day`;

        if (age !== 1) {
            result += 's';
        }
    } else if (numericDuration > ONE_HOUR - 1) {
        age = normalizeAge((numericDuration / ONE_HOUR).toFixed(2));
        result = `+ ${age} hour`;

        if (age !== 1) {
            result += 's';
        }
    } else {
        age = normalizeAge((numericDuration / ONE_MINUTE).toFixed(2));
        result = `+ ${age} min`;

        if (age !== 1) {
            result += 's';
        }
    }

    return result;
}

export function getPreciseDuration(numericDuration) {
    let result;

    const days = toDoubleDigits(Math.floor((numericDuration) / (24 * 60 * 60 * 1000)));
    let remaining = (numericDuration) % (24 * 60 * 60 * 1000);
    const hours = toDoubleDigits(Math.floor((remaining) / (60 * 60 * 1000)));
    remaining = (remaining) % (60 * 60 * 1000);
    const minutes = toDoubleDigits(Math.floor((remaining) / (60 * 1000)));
    remaining = (remaining) % (60 * 1000);
    const seconds = toDoubleDigits(Math.floor((remaining) / (1000)));
    result = `${days}:${hours}:${minutes}:${seconds}`;

    return result;
}
