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
import ObjectViewsRegistry from '../../ui/registries/ViewRegistry.js';
import InspectorViewsRegistry from '../../ui/registries/InspectorViewRegistry.js';
import TelemetryTableViewProvider from './TelemetryTableViewProvider.js';
import TableConfigurationViewProvider from './TableConfigurationViewProvider.js';

fdescribe('The TelemetryTable plugin', function() {
    let openmct;
    let tableType;
    let objectViewsSpy;
    let inspectorViewsSpy;

    beforeEach(function () {
        objectViewsSpy = spyOn(ObjectViewsRegistry.prototype, 'addProvider');
        inspectorViewsSpy = spyOn(InspectorViewsRegistry.prototype, 'addProvider');
        openmct = new MCT();
        tableType = openmct.types.get('table');
    });

    describe('defines a telemetry object type', function () {
        it('that is registered with the type registry.', function () {
            expect(tableType).toBeDefined();        
        });

        it('that is createable.', function () {
            expect(tableType.definition.creatable).toBe(true);
        });

        describe('that initializes new table object.', function () {
            let tableObject;

            beforeEach(function () {
                tableObject = {};
                tableType.definition.initialize(tableObject);        
            });
            it('with valid default configuration.', function () {
                expect(tableObject.configuration.hiddenColumns).toBeDefined();
            });
            it('to support composition.', function () {
                expect(tableObject.composition).toBeDefined();
            });
        });
    });

    it('registers the table view provider', function () {
        expect(objectViewsSpy).toHaveBeenCalledWith(new TelemetryTableViewProvider(openmct));
    });

    it('registers the table configuration view provider', function () {
        expect(inspectorViewsSpy).toHaveBeenCalledWith(new TableConfigurationViewProvider(openmct));
    });

    /*
    it('defines a view for telemetry objects', function() {
        let tableObject = createTableObject();
        let views = openmct.objectViews.get(tableObject);
        
        expect(findTableView(views)).toBeDefined();
    });

    it('defines a table view for telemetry objects', function() {
        let telemetryObject = createTelemetryObject();
        let views = openmct.objectViews.get(telemetryObject);
        
        expect(findTableView(views)).toBeDefined();
    });

    it('defines a configuration view for table objects', function() {
        let tableObject = createTableObject();
        let selection = createSelection(tableObject);
        let views = openmct.inspectorViews.get(selection);

        expect(views).toBeDefined();
        expect(findTableView(views)).toBeDefined();
    });
    function findTableView(views) {
        return views.find(view => view.key === 'table');
    }

    function createTableObject() {
        let tableObject = {};
        tableType.definition.initialize(tableObject);

        return tableObject;
    }

    function createTelemetryObject() {
        return {
            telemetry: {}
        };
    }

    function createSelection(object) {
        return [{
            context: {
                item: object
            }
        }];
    }
    */
});