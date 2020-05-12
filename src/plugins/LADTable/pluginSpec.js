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
    getMockObjects,
    getMockTelemetry
} from 'testTools';

let openmct,
    ladPlugin,
    parent,
    child;

let selectors = {};
selectors.ladTableClass = '.c-table.c-lad-table';
selectors.ladTableBodyRows = selectors.ladTableClass + ' tbody tr';
selectors.ladTableBodyRowsFirstData = selectors.ladTableBodyRows + ' td:first-child';
selectors.ladTableBodyRowsSecondtData = selectors.ladTableBodyRows + ' td:nth-child(2)';
selectors.ladTableBodyRowsThirdData = selectors.ladTableBodyRows + ' td:nth-child(3)';
selectors.ladTableFirstBodyRow = selectors.ladTableClass + ' tbody tr:first-child';
selectors.ladTableFirstRowFirstData = selectors.ladTableBodyRows + ' td:first-child';
selectors.ladTableFirstRowSecondData = selectors.ladTableBodyRows + ' td:nth-child(2)';
selectors.ladTableFirstRowThirdData = selectors.ladTableBodyRows + ' td:nth-child(3)';

describe("The LAD Table", () => {

    let ladTableKey = 'LadTable',
        telemetryCount = 2,
        timeFormat = 'utc',
        mockTelemetry = getMockTelemetry({ count: telemetryCount, format: timeFormat }),
        mockObj = getMockObjects({
            objectKeyStrings: ['ladTable', 'telemetry'],
            format: timeFormat
        });

    // add telemetry object as composition in lad table
    mockObj.ladTable.composition.push(mockObj.telemetry.identifier);

    // this setups up the app
    beforeEach((done) => {
        const appHolder = document.createElement('div');
        appHolder.style.width = '640px';
        appHolder.style.height = '480px';

        openmct = createOpenMct();

        parent = document.createElement('div');
        child = document.createElement('div');
        parent.appendChild(child);

        spyOn(openmct.telemetry, 'request').and.returnValue(Promise.resolve([]));

        ladPlugin = new LadPlugin();
        openmct.install(ladPlugin);

        // spyOn(openmct.objects, 'mutate').and.returnValue(true);

        spyOn(openmct.objects, 'get').and.returnValue(Promise.resolve({}));

        openmct.time.bounds({start: 0, end: 3});

        openmct.on('start', done);
        openmct.start(appHolder);
    });

    it("should provide a table view only for lad table objects", () => {
        let applicableViews = openmct.objectViews.get(mockObj.ladTable),
            ladTableView = applicableViews.find(
                (viewProvider) => viewProvider.key === ladTableKey
            );

        expect(applicableViews.length).toEqual(1);
        expect(ladTableView).toBeDefined();
    });

    describe('composition', () => {
        let ladTableCompositionCollection;

        beforeEach(() => {
            ladTableCompositionCollection = openmct.composition.get(mockObj.ladTable);
            ladTableCompositionCollection.load();
        });

        it("should accept telemetry producing objects", () => {
            expect(() => {
                ladTableCompositionCollection.add(mockObj.telemetry);
            }).not.toThrow();
        });

        it("should reject non-telemtry producing objects", () => {
            expect(()=> {
                ladTableCompositionCollection.add(mockObj.ladTable);
            }).toThrow();
        });
    });

    describe("table view", () => {
        let applicableViews,
            // ladTableCompositionCollection,
            ladTableViewProvider,
            ladTableView,
            anotherTelemetryObj = getMockObjects({
                objectKeyStrings: ['telemetry'],
                overwrite: {
                    telemetry: {
                        name: "New Telemetry Object",
                        identifier: { namespace: "", key: "another-telemetry-object" }
                    }
                }
            }).telemetry;

        // add another telemetry object as composition in lad table to test multi rows
        mockObj.ladTable.composition.push(anotherTelemetryObj.identifier);

        beforeEach(async () => {
            let telemetryRequestResolve,
                telemetryObjectResolve,
                anotherTelemetryObjectResolve;
            let telemetryRequestPromise = new Promise((resolve) => {
                    telemetryRequestResolve = resolve;
                }),
                telemetryObjectPromise = new Promise((resolve) => {
                    telemetryObjectResolve = resolve;
                }),
                anotherTelemetryObjectPromise = new Promise((resolve) => {
                    anotherTelemetryObjectResolve = resolve;
                })
            openmct.telemetry.request.and.callFake(() => {
                telemetryRequestResolve(mockTelemetry);
                return telemetryRequestPromise;
            });
            openmct.objects.get.and.callFake((obj) => {
                if(obj.key === 'telemetry-object') {
                    telemetryObjectResolve(mockObj.telemetry);
                    return telemetryObjectPromise;
                } else {
                    anotherTelemetryObjectResolve(anotherTelemetryObj);
                    return anotherTelemetryObjectPromise;
                }
            });

            applicableViews = openmct.objectViews.get(mockObj.ladTable);
            ladTableViewProvider = applicableViews.find((viewProvider) => viewProvider.key === ladTableKey);
            ladTableView = ladTableViewProvider.view(mockObj.ladTable, [mockObj.ladTable]);
            ladTableView.show(child, true);

            // ladTableCompositionCollection = openmct.composition.get(mockObj.ladTable);
            // ladTableCompositionCollection.load();

            await Promise.all([telemetryRequestPromise, telemetryObjectPromise, anotherTelemetryObjectPromise]);
            return await Vue.nextTick();
        });

        it("should show one row per object in the composition", () => {
            const rowCount = parent.querySelectorAll(selectors.ladTableBodyRows).length;
            expect(rowCount).toBe(mockObj.ladTable.composition.length);
        });

        it("when an item is removed, it should no longer be in the table", async () => {
            // ladTableCompositionCollection.remove(mockObj.telemetry);
            // await Vue.nextTick();
            const rowCount = parent.querySelectorAll(selectors.ladTableBodyRows).length;
            expect(rowCount).toBe(1);
            pending();
        });

        it("should show the most recent datum from the telemetry producing object", () => {
            expect(true).toBe(false);
            pending();
        });

        it("should show the name provided for the the telemetry producing object", () => {
            const rowName = parent.querySelector(selectors.ladTableFirstRowFirstData).innerText,
                expectedName = mockObj.telemetry.name;
            expect(rowName).toBe(expectedName);
        });

        it("should show the correct values for the datum based on domain and range hints", () => {
            const range = mockObj.telemetry.telemetry.values.find((val) => {
                return val.hints && val.hints.range !== undefined;
            }).key;
            const domain = mockObj.telemetry.telemetry.values.find((val) => {
                return val.hints && val.hints.domain !== undefined;
            }).key;
            const mostRecentTelemetry = mockTelemetry.reduce((prev, cur) => {
                return prev[timeFormat] > cur[timeFormat] ? prev : cur;
            });
            const rangeValue = mostRecentTelemetry[range];
            const domainValue = new Date(mostRecentTelemetry[domain]).toISOString().replace('T', ' ');
            const actualDomainValue = parent.querySelector(selectors.ladTableFirstRowSecondData).innerText;
            const actualRangeValue = parent.querySelector(selectors.ladTableFirstRowThirdData).innerText;
            expect(actualRangeValue).toBe(rangeValue);
            expect(actualDomainValue).toBe(domainValue);
            expect(true).toBe(false);
            pending();
        });
    });

    it("should only add telemetry within set bounds", () => {
        // set up time bounds from telemetry
        expect(true).toBe(false);
        pending();
    });

});


describe("The LAD Table Set", () => {
    const ladTableSetKey = 'LadTableSet';
    let mockObj = getMockObjects({
        objectKeyStrings: ['ladTable', 'ladTableSet']
    });


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

        openmct.on('start', done);
        openmct.start(appHolder);
    });

    it("should provide a lad table set view only for lad table set objects", () => {
        let applicableViews = openmct.objectViews.get(mockObj.ladTableSet),
            ladTableSetView = applicableViews.find(
                (viewProvider) => viewProvider.key === ladTableSetKey
            );

        expect(applicableViews.length).toEqual(1);
        expect(ladTableSetView).toBeDefined();
    });

});
