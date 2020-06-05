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
import {
    createOpenMct,
    resetApplicationState
} from 'utils/testing';

describe("The URLTimeSettingsSynchronizer", () => {
    let openmct;
    beforeAll(() => resetApplicationState());

    beforeEach((done) => {
        openmct = createOpenMct();
        openmct.install(openmct.plugins.LocalTimeSystem());
        openmct.on('start', done);
        openmct.startHeadless();
    });

    afterEach(() => resetApplicationState(openmct));

    describe("in fixed timespan mode", ()=>{
        beforeEach(() => {
            openmct.time.stopClock();
            openmct.time.timeSystem('utc', {start: 0, end: 1});
        });

        it("when bounds are set via the time API, they are immediately reflected in the URL", ()=>{
            //Test expected initial conditions
            expect(window.location.hash.includes('tc.startBound=0')).toBe(true);
            expect(window.location.hash.includes('tc.endBound=1')).toBe(true);

            openmct.time.bounds({start: 10, end: 20});

            expect(window.location.hash.includes('tc.startBound=10')).toBe(true);
            expect(window.location.hash.includes('tc.endBound=20')).toBe(true);

            //Test that expected initial conditions are no longer true
            expect(window.location.hash.includes('tc.startBound=0')).toBe(false);
            expect(window.location.hash.includes('tc.endBound=1')).toBe(false);
        });

        it("when time system is set via the time API, it is immediately reflected in the URL", ()=>{
            //Test expected initial conditions
            expect(window.location.hash.includes('tc.timeSystem=utc')).toBe(true);
            expect(window.location.hash.includes('tc.startBound=0')).toBe(true);
            expect(window.location.hash.includes('tc.endBound=1')).toBe(true);

            openmct.time.timeSystem('local', {start: 20, end: 30});

            expect(window.location.hash.includes('tc.timeSystem=local')).toBe(true);
            expect(window.location.hash.includes('tc.startBound=20')).toBe(true);
            expect(window.location.hash.includes('tc.endBound=30')).toBe(true);

            //Test that expected initial conditions are no longer true
            expect(window.location.hash.includes('tc.timeSystem=utc')).toBe(false);
            expect(window.location.hash.includes('tc.startBound=0')).toBe(false);
            expect(window.location.hash.includes('tc.endBound=1')).toBe(false);
        });
    });
});
