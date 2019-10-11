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

define([
    './plugin',
    'MCT'
], function (TablePlugin, MCT) {
    let openmct;
    let tablePlugin;
    let target;

    beforeEach((done) => {
        target = document.createElement('div');
        openmct = new MCT();
        tablePlugin = new TablePlugin();
        openmct.install(openmct.plugins.LocalStorage());
        openmct.install(tablePlugin);
        openmct.on('start', done);
        openmct.start(target);
    });
    fdescribe("the plugin", () => {
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
    describe("The table view", () => {
        it("returns true",() => {
            expect(true).toBe(true);
        });
    });
});
