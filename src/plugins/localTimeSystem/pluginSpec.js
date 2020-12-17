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

import LocalTimeFormat from './LocalTimeFormat.js';

import {
    createOpenMct,
    resetApplicationState
} from 'utils/testing';

describe("The local time", () => {
    const LOCAL_FORMAT_KEY = 'local-format';
    const LOCAL_SYSTEM_KEY = 'local';
    const JUNK = "junk";
    const TIMESTAMP = -14256000000;
    const DATESTRING = '1969-07-20 12:00:00.000 am';
    let openmct;
    let dateString;
    let timeStamp;
    let localTimeFormatter;
    let localTimeSystem;

    beforeEach((done) => {

        openmct = createOpenMct();

        openmct.install(openmct.plugins.LocalTimeSystem());

        openmct.on('start', done);
        openmct.startHeadless();

        localTimeSystem = openmct.time.timeSystem('local', {
            start: 0,
            end: 4
        });

        localTimeFormatter = new LocalTimeFormat();
        dateString = localTimeFormatter.format(TIMESTAMP);
        timeStamp = localTimeFormatter.parse(DATESTRING);
    });

    afterEach(() => {
        return resetApplicationState(openmct);
    });

    describe("system", function () {

        it("is installed", () => {
            let timeSystems = openmct.time.getAllTimeSystems();
            let local = timeSystems.find(ts => ts.key === 'local');

            expect(local).not.toEqual(-1);
        });

        it("can be set to be the main time system", () => {
            expect(openmct.time.timeSystem().key).toBe('local');
        });

        it("uses the local-format time format", () => {
            expect(localTimeSystem.timeFormat).toBe(LOCAL_FORMAT_KEY);
        });

        it("is UTC based", () => {
            expect(localTimeSystem.isUTCBased).toBe(true);
        });

        it("defines expected metadata", () => {
            expect(localTimeSystem.key).toBe(LOCAL_SYSTEM_KEY);
            expect(localTimeSystem.name).toBeDefined();
            expect(localTimeSystem.cssClass).toBeDefined();
            expect(localTimeSystem.durationFormat).toBeDefined();
        });
    });

    describe("formatter class", () => {

        it("will format a timestamp in local time format", () => {
            expect(localTimeFormatter.format(TIMESTAMP)).toBe(dateString);
        });

        it("will parse an local time Date String into milliseconds", () => {
            expect(localTimeFormatter.parse(DATESTRING)).toBe(timeStamp);
        });

        it("will validate correctly", () => {
            expect(localTimeFormatter.validate(DATESTRING)).toBe(true);
            expect(localTimeFormatter.validate(JUNK)).toBe(false);
        });
    });

    describe("formatter can be obtained from the telemetry API and", () => {
        let formatter;

        beforeEach(() => {
            formatter = openmct.telemetry.getFormatter(LOCAL_FORMAT_KEY);
            console.log(formatter);
        });

        it("will format a timestamp in local time format", () => {
            expect(formatter.format(TIMESTAMP)).toBe(dateString);
        });

        it("will parse an local time Date String into milliseconds", () => {
            expect(formatter.parse(DATESTRING)).toBe(timeStamp);
        });

        it("will validate correctly", () => {
            expect(formatter.validate(DATESTRING)).toBe(true);
            expect(formatter.validate(JUNK)).toBe(false);
        });
    });
});
