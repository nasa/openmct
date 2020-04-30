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
import LadPlugin from './plugin.js';
import Vue from 'vue';
import {
    createOpenMct
    // createMouseEvent
} from 'testTools';

let openmct,
    ladPlugin,
    parent,
    child;

fdescribe("The LAD Table", () => {

    const ladTableKey = 'LadTable',
        mockObj = {
            ladTable: {
                id:"test-object",
                type: ladTableKey
            },
            telemetry: {
                identifier:{ namespace: "", key: "test-object"},
                type: "test-object",
                name: "Test Object",
                telemetry: {
                    values: [{
                        key: "some-key",
                        utc: 0,
                        name: "Some attribute",
                        hints: {
                            domain: 1
                        }
                    }, {
                        key: "some-other-key",
                        utc: 1,
                        name: "Some other attribute",
                        hints: {
                            range: 1
                        }
                    }]
                }
            }
        };

    beforeEach((done) => {
        const appHolder = document.createElement('div');
        appHolder.style.width = '640px';
        appHolder.style.height = '480px';

        openmct = createOpenMct();

        parent = document.createElement('div');
        child = document.createElement('div');
        parent.appendChild(child);

        ladPlugin = new LadPlugin();
        openmct.install(ladPlugin);

        spyOn(openmct.telemetry, 'request').and.returnValue(Promise.resolve([]));

        openmct.on('start', done);
        openmct.start(appHolder);
    });

    it("provides a lad table view for only lad table objects", () => {
        let applicableViews = openmct.objectViews.get(mockObj.ladTable),
            ladTableView = applicableViews.find((viewProvider) => viewProvider.key === ladTableKey);
        expect(applicableViews.length).toEqual(1);
        expect(ladTableView).toBeDefined();
    });

    describe("The table view", () => {
        let applicableViews,
            ladTableViewProvider,
            ladTableView;

        beforeEach(() => {
            applicableViews = openmct.objectViews.get(mockObj.ladTable);
            ladTableViewProvider = applicableViews.find((viewProvider) => viewProvider.key === ladTableKey);
            ladTableView = ladTableViewProvider.view(mockObj.ladTable, true, [mockObj.ladTable]);
            ladTableView.show(child, true);
            return Vue.nextTick();
        });

        it("should accept ONLY telemetry producing objects", () => {
            console.log(ladTableView);
            expect(true).toBe(false);
        });

    });

    it("when an item is removed, it should no longer be in the table", () => {
        expect(true).toBe(false);
        pending();
    });
    it("should, if not in edit mode, droping telemtry object into lad table should add object and switch to edit mode", () => {
        expect(true).toBe(false);
        pending();
    });
    it("should reject non-telemtry producing objects", () => {
        expect(true).toBe(false);
        pending();
    });
    it("should show one row per oject in the composition", () => {
        expect(true).toBe(false);
        pending();
    });
    it("should show the most recent datum from the telemetry producing object", () => {
        expect(true).toBe(false);
        pending();
    });
    it("should show the name provided for the datum", () => {
        expect(true).toBe(false);
        pending();
    });
    it("should show the correct value for the datum dependent on hints", () => {
        expect(true).toBe(false);
        pending();
    });
    it("should only add telemetry within set bounds", () => {
        expect(true).toBe(false);
        pending();
    });

    
});


describe("The LAD Table Set", () => {
    it("lad table tests", () => {
        expect(true).toBe(false);
        pending();
    });
});
