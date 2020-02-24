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

import ConditionManager  from './ConditionManager';

describe('ConditionManager', () => {

    let conditionMgr;
    let testTelemetryObject;
    let openmct = {};
    let parentDomainObject;
    let composition;

    beforeAll(function () {
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
        openmct.telemetry = jasmine.createSpyObj('telemetry', ['isTelemetryObject']);
        conditionMgr = new ConditionManager(openmct);
        parentDomainObject = {};
        composition = {};
    });

    it('creates a conditionCollection with a default condition', function () {

    });

    it('adds a condition to the collection with one criterion', function () {

    });

    it('updates a condition\'s criteria to something valid', function () {

    });

    it('removes a condition from the conditionCollection', function () {

    });

});
