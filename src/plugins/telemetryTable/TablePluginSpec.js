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
import _ from 'lodash';
import MCT from '../../MCT.js';

fdescribe('The TelemetryTable plugin', function() {
    let openmct;

    beforeEach(function () {
        openmct = new MCT();
    });

    describe('defines a telemetry object type', function () {
        let tableType;

        beforeEach(function () {
            tableType = openmct.types.get('table');
        });

        it('is registered with the type registry', function () {
            expect(tableType).toBeDefined();        
        });

        it('is createable', function () {
            expect(tableType.definition.creatable).toBe(true);
        });

        describe('initializes new table objects', function () {
            let tableObject;

            beforeEach(function () {
                tableObject = {};
                tableType.definition.initialize(tableObject);
            });
            it('with valid default configuration', function () {
                expect(tableObject.configuration.hiddenColumns).toBeDefined();
            });
            it('to support composition', function () {
                expect(tableObject.composition).toBeDefined();
            });
        })
    });

    it('defines a view for telemetry objects', function() {
        
    });
    it('defines a table view for telemetry objects', function() {

    });
});