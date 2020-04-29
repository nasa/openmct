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
    createOpenMct,
    createMouseEvent
} from 'testTools';

let openmct,
    ladPlugin,
    parent,
    child;

fdescribe("The LAD Table", () => {

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

    it("should accept ONLY telemetry producing objects", () => {
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

    describe("The table view", () => {
        let testTelemetryObject;
        let applicableViews;
        let tableViewProvider;
        let tableView;

        beforeEach(() => {
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
            applicableViews = openmct.objectViews.get(testTelemetryObject);
            tableViewProvider = applicableViews.find((viewProvider) => viewProvider.key === 'table');
            tableView = tableViewProvider.view(testTelemetryObject, true, [testTelemetryObject]);
            tableView.show(child, true);
            return Vue.nextTick();
        });

        it("Renders a column for every item in telemetry metadata",() => {
            let headers = parent.querySelectorAll('span.c-telemetry-table__headers__label');
            expect(headers.length).toBe(2);
            expect(headers[0].innerText).toBe('Some attribute');
            expect(headers[1].innerText).toBe('Another attribute');
        });

        it("Supports column reordering via drag and drop",() => {
            let columns = parent.querySelectorAll('tr.c-telemetry-table__headers__labels th');
            let fromColumn = columns[0];
            let toColumn = columns[1];
            let fromColumnText = fromColumn.querySelector('span.c-telemetry-table__headers__label').innerText;
            let toColumnText = toColumn.querySelector('span.c-telemetry-table__headers__label').innerText;

            let dragStartEvent = createMouseEvent('dragstart');
            let dragOverEvent = createMouseEvent('dragover');
            let dropEvent = createMouseEvent('drop');

            dragStartEvent.dataTransfer =
                dragOverEvent.dataTransfer =
                    dropEvent.dataTransfer = new DataTransfer();

            fromColumn.dispatchEvent(dragStartEvent);
            toColumn.dispatchEvent(dragOverEvent);
            toColumn.dispatchEvent(dropEvent);

            return Vue.nextTick().then(() => {
                columns = parent.querySelectorAll('tr.c-telemetry-table__headers__labels th');
                let firstColumn = columns[0];
                let secondColumn = columns[1];
                let firstColumnText = firstColumn.querySelector('span.c-telemetry-table__headers__label').innerText;
                let secondColumnText = secondColumn.querySelector('span.c-telemetry-table__headers__label').innerText;

                expect(fromColumnText).not.toEqual(firstColumnText);
                expect(fromColumnText).toEqual(secondColumnText);
                expect(toColumnText).not.toEqual(secondColumnText);
                expect(toColumnText).toEqual(firstColumnText);
            });
        });
    });
});


describe("The LAD Table Set", () => {

});
