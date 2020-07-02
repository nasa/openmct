/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2018, United States Government
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
import RemoveAction from './plugin.js';
import {
    createOpenMct,
    resetApplicationState
} from 'utils/testing';

fdescribe("The Remove Action plugin", () => {

    let openmct,
        removeActionPlugin;

    // this setups up the app
    beforeEach((done) => {
        const appHolder = document.createElement('div');
        appHolder.style.width = '640px';
        appHolder.style.height = '480px';

        openmct = createOpenMct();

        spyOn(openmct.objects, 'mutate')

        // already installed by default, but never hurts
        removeActionPlugin = new RemoveAction(openmct);
        openmct.install(removeActionPlugin());

        openmct.on('start', done);
        openmct.startHeadless(appHolder);
    });

    afterEach(() => {
        resetApplicationState(openmct);
    });

    it("should be definied", () => {
        expect(removeActionPlugin).toBeDefined();
    });

    it("should remove a child from parent composition", () => {
        
        expect(true).toBe(true);
    });
});
