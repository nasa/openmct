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
import {createWrapper} from '@vue/test-utils';

import TablePlugin from './plugin.js';
import MCT from 'MCT';

let openmct;
let tablePlugin;
let element;

beforeEach((done) => {
    element = document.createElement('div');
    element.style.width = '640px';
    element.style.height = '480px';
    document.body.appendChild(element);
    openmct = new MCT();
    tablePlugin = new TablePlugin();
    openmct.install(openmct.plugins.LocalStorage());
    openmct.install(openmct.plugins.UTCTimeSystem());
    openmct.time.timeSystem('utc', {start: 0, end: 1});
    openmct.install(tablePlugin);
    openmct.on('start', done);
    spyOn(openmct.telemetry, 'request').and.returnValue(Promise.resolve([]));
    openmct.start();
});
describe("the plugin", () => {
    it("provides a table view for objects with telemetry", () => {
        const testTelemetryObject = {
            id:"test-object",
            type: "test-object",
            telemetry: {
                values: [{
                    key: "some-key"
                }]
            }
        };

        const applicableViews = openmct.objectViews.get(testTelemetryObject);
        let tableView = applicableViews.find((viewProvider) => viewProvider.key === 'table');
        expect(tableView).toBeDefined();
    });
});
fdescribe("The table view", () => {
    it("Renders a column for every item in telemetry metadata",(done) => {
        const testTelemetryObject = {
            identifier:{ namespace: "", key: "test-object"},
            type: "test-object",
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

        const applicableViews = openmct.objectViews.get(testTelemetryObject);
        let tableViewProvider = applicableViews.find((viewProvider) => viewProvider.key === 'table');
        let tableView = tableViewProvider.view(testTelemetryObject, false, [testTelemetryObject]);
        tableView.show(element, false);
        //let wrapper = createWrapper(element);
        //let headers = wrapper.findAll('.c-telemetry-table__headers__labels');
        setTimeout(() => {
            console.log(element);
            //expect(headers.length).toBe(2);
            done();
        }, 500);
    });
});
