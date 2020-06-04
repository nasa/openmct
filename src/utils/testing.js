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

import MCT from 'MCT';
let nativeFunctions = [];

export function createOpenMct() {
    const openmct = new MCT();
    openmct.install(openmct.plugins.LocalStorage());
    openmct.install(openmct.plugins.UTCTimeSystem());
    openmct.time.timeSystem('utc', {start: 0, end: 1});

    return openmct;
}

export function createMouseEvent(eventName) {
    return new MouseEvent(eventName, {
        bubbles: true,
        cancelable: true,
        view: window
    });
}

export function spyOnBuiltins(functionNames, object = window) {
    functionNames.forEach(functionName => {
        if (nativeFunctions[functionName]) {
            throw `Builtin spy function already defined for ${functionName}`;
        }

        nativeFunctions.push({functionName, object, nativeFunction: object[functionName]});
        spyOn(object, functionName);
    });
}

export function clearBuiltinSpies() {
    nativeFunctions.forEach(clearBuiltinSpy);
    nativeFunctions = [];
}

export function resetApplicationState() {
    clearBuiltinSpies();
    window.location.hash = '#';
}

function clearBuiltinSpy(funcDefinition) {
    funcDefinition.object[funcDefinition.functionName] = funcDefinition.nativeFunction;
}
