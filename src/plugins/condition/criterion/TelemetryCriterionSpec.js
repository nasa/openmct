/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2019, United States Government
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

import TelemetryCriterion from "./TelemetryCriterion";

let openmct = {},
    mockListener,
    testTelemetryObject,
    telemetryCriterion;

describe("The telemetry criterion", function () {

    beforeEach (() => {
        testTelemetryObject = {
            identifier:{ namespace: "", key: "test-object"},
            type: "test-object",
            name: "Test Object",
            telemetry: {
                values: [{
                    key: "some-key",
                    name: "Some attribute",
                    hints: {
                        domain: 1
                    }
                }, {
                    key: "some-other-key",
                    name: "Another attribute",
                    hints: {
                        range: 1
                    }
                }]
            }
        };
        openmct.objects = jasmine.createSpyObj('objects', ['get', 'makeKeyString']);
        openmct.objects.get.and.returnValue(testTelemetryObject);
        openmct.objects.makeKeyString.and.returnValue(testTelemetryObject.identifier.key);
        openmct.telemetry = jasmine.createSpyObj('telemetry', ['isTelemetryObject', "subscribe"]);
        openmct.telemetry.isTelemetryObject.and.returnValue(true);
        openmct.telemetry.subscribe.and.returnValue(function () {});

        mockListener = jasmine.createSpy('listener');

        telemetryCriterion = new TelemetryCriterion(
            testTelemetryObject.identifier,
            openmct
        );

        telemetryCriterion.on('criterionUpdated', mockListener);

    });

    it("initializes with a telemetry objectId as string", function () {
        expect(telemetryCriterion.telemetryObjectIdAsString).toEqual(testTelemetryObject.identifier.key);
    });

    it("subscribes to telemetry providers", function () {
        telemetryCriterion.subscribe();
        expect(telemetryCriterion.subscription).toBeDefined();
    });

    it("normalizes telemetry data", function () {
        let result = telemetryCriterion.normalizeData({
            key: 'some-key',
            source: 'testSource',
            testSource: 'Hello'
        });
        expect(result).toEqual({
            'some-key': 'Hello'
        })
    });

    it("emits update event on new data from telemetry providers", function () {
        spyOn(telemetryCriterion, 'emitResult').and.callThrough();
        telemetryCriterion.handleSubscription({
            key: 'some-key',
            source: 'testSource',
            testSource: 'Hello'
        });
        expect(telemetryCriterion.emitResult).toHaveBeenCalled();
        expect(mockListener).toHaveBeenCalled();
    });

    it("un-subscribes from telemetry providers", function () {
        telemetryCriterion.subscribe();
        expect(telemetryCriterion.subscription).toBeDefined();
        telemetryCriterion.unsubscribe();
        expect(telemetryCriterion.subscription).toBeUndefined();
        expect(telemetryCriterion.telemetryObjectIdAsString).toBeUndefined();
        expect(telemetryCriterion.telemetryObject).toBeUndefined();
        expect(telemetryCriterion.telemetryMetadata).toBeUndefined();
    });

});
