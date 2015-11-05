/*****************************************************************************
 * Open MCT Web, Copyright (c) 2009-2015, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT Web is licensed under the Apache License, Version 2.0 (the
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
 * Open MCT Web includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/
/*global define,describe,it,expect,beforeEach,waitsFor,jasmine,window,afterEach*/

define(
    ['../../../src/controllers/swimlane/TimelineColorAssigner'],
    function (TimelineColorAssigner) {
        'use strict';

        describe("The Timeline legend color assigner", function () {
            var testConfiguration,
                assigner;

            beforeEach(function () {
                testConfiguration = {};
                assigner = new TimelineColorAssigner(testConfiguration);
            });

            it("assigns colors by identifier", function () {
                expect(assigner.get('xyz')).toBeUndefined();
                assigner.assign('xyz');
                expect(assigner.get('xyz')).toEqual(jasmine.any(String));
            });

            it("releases colors", function () {
                assigner.assign('xyz');
                assigner.release('xyz');
                expect(assigner.get('xyz')).toBeUndefined();
            });

            it("provides at least 30 unique colors", function () {
                var colors = {}, i, ids = [];

                // Add item to set
                function set(c) { colors[c] = true; }

                // Generate ids
                for (i = 0; i < 30; i += 1) { ids.push("id" + i); }

                // Assign colors to each id, then retrieve colors,
                // storing into the set
                ids.forEach(assigner.assign);
                ids.map(assigner.get).map(set);

                // Should now be 30 elements in that set
                expect(Object.keys(colors).length).toEqual(30);
            });

            it("populates the configuration with colors", function () {
                assigner.assign('xyz');
                expect(testConfiguration.xyz).toBeDefined();
            });

            it("preserves other colors when releases occur", function () {
                var c;
                assigner.assign('xyz');
                c = assigner.get('xyz');
                // Assign/release a different color
                assigner.assign('abc');
                assigner.release('abc');
                // Our original assignment should be preserved
                expect(assigner.get('xyz')).toEqual(c);
            });

        });
    }
);
