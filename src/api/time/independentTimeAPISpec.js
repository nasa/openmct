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

import IndependentTimeAPI from "./independentTimeAPI";
describe("The Independent Time API", function () {
    let api;
    let domainObjectKey;
    let clockKey;
    let clock;
    let bounds;
    let eventListener;

    beforeEach(function () {
        api = new IndependentTimeAPI();
        clockKey = "someClockKey";
        clock = jasmine.createSpyObj("clock", [
            "on",
            "off",
            "currentValue"
        ]);
        clock.currentValue.and.returnValue(100);
        clock.key = clockKey;
        domainObjectKey = 'test-key';
        bounds = {
            start: 0,
            end: 1
        };
        eventListener = jasmine.createSpy("eventListener");
    });

    it("Allows setting of valid bounds", function () {
        bounds = {
            start: 0,
            end: 1
        };
        expect(api.get(domainObjectKey)).not.toBe(bounds);
        expect(api.set(domainObjectKey, bounds));
        expect(api.get(domainObjectKey)).toBe(bounds);
    });

    it("Disallows setting of invalid bounds", function () {
        bounds = {
            start: 1,
            end: 0
        };
        expect(api.get(domainObjectKey)).not.toEqual(bounds);
        expect(api.set.bind(api, domainObjectKey, bounds)).toThrow();
        expect(api.bounds()).not.toEqual(bounds);

        bounds = {start: 1};
        expect(api.get(domainObjectKey)).not.toEqual(bounds);
        expect(api.set.bind(api, domainObjectKey, bounds)).toThrow();
        expect(api.get(domainObjectKey)).not.toEqual(bounds);
    });

    it("Emits an event when bounds change", function () {
        expect(eventListener).not.toHaveBeenCalled();
        api.on(domainObjectKey, eventListener);
        api.set(domainObjectKey, bounds);
        expect(eventListener).toHaveBeenCalledWith('bounds', bounds, false);
    });

    describe(" when using real time clock", function () {
        const mockOffsets = {
            start: 0,
            end: 1
        };

        it("Emits an event when bounds change based on current value", function () {
            expect(eventListener).not.toHaveBeenCalled();
            api.on(domainObjectKey, eventListener);
            api.set(domainObjectKey, mockOffsets, 'someClockKey');
            api.tick(10);
            expect(eventListener).toHaveBeenCalledWith('bounds', {
                start: 10,
                end: 11
            }, true);
        });

    });
});
