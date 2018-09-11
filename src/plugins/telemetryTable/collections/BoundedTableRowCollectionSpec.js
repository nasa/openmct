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
import MCT from '../../../MCT.js';
import SortedTableRowCollection from './SortedTableRowCollection.js';

describe('The SortedTableRowCollection', function() {
    let mockTimeSystem;
    let openmct;
    let rows;
    let mockSortedIndex;

    beforeEach(function () {
        openmct = new MCT();
        mockTimeSystem = {
            key: 'utc'
        };
        spyOn(openmct.time, 'timeSystem');
        openmct.time.timeSystem.and.returnValue(mockTimeSystem);
        rows = new BoundedTableRowCollection(openmct);
    });

    describe('Shortcut behavior', function() {
        let testTelemetry;
        beforeEach(function() {
            testTelemetry = [
                {
                    datum: {utc: 100}
                }, {
                    datum: {utc: 200}
                }, {
                    datum: {utc: 300}
                }, {
                    datum: {utc: 400}
                }
            ];
            rows.add(testTelemetry);
            mockSortedIndex = spyOn(_, 'sortedIndex');
            mockSortedIndex.and.callThrough();
        });
        describe('when sorted ascending', function () {
            it('Uses lodash sortedIndex to find insertion point when test value is between first and last values', function () {
                rows.add({
                    datum: {utc: 250}
                });
                expect(mockSortedIndex).toHaveBeenCalled();
            });    
            it('shortcuts insertion point search when test value is greater than last value', function() {
                rows.add({
                    datum: {utc: 500}
                });
                expect(mockSortedIndex).not.toHaveBeenCalled();
            });
            it('shortcuts insertion point search when test value is less than or equal to first value', function () {
                rows.add({
                    datum: {utc: 100}
                });

                rows.add({
                    datum: {utc: 50}
                });
                expect(mockSortedIndex).not.toHaveBeenCalled();
            });
        });
        describe('when sorted descending', function () {
            it('Uses lodash sortedIndex to find insertion point when test value is between first and last values', function () {
                rows.add({
                    datum: {utc: 250}
                });
                expect(mockSortedIndex).toHaveBeenCalled();
            });    
            it('shortcuts insertion point search when test value is greater than last value', function() {
                rows.add({
                    datum: {utc: 500}
                });
                expect(mockSortedIndex).not.toHaveBeenCalled();
            });
            it('shortcuts insertion point search when test value is less than or equal to first value', function () {
                rows.add({
                    datum: {utc: 100}
                });

                rows.add({
                    datum: {utc: 50}
                });
                expect(mockSortedIndex).not.toHaveBeenCalled();
            });
        });
        it('Evicts old telemetry on bounds change');
        it('Does not drop data that falls ahead of end bounds');
    });
});