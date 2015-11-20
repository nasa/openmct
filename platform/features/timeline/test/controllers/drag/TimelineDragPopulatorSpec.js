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
    ['../../../src/controllers/drag/TimelineDragPopulator'],
    function (TimelineDragPopulator) {
        "use strict";

        describe("The timeline drag populator", function () {
            var mockObjectLoader,
                mockPromise,
                mockSwimlane,
                mockDomainObject,
                populator;

            beforeEach(function () {
                mockObjectLoader = jasmine.createSpyObj("objectLoader", ["load"]);
                mockPromise = jasmine.createSpyObj("promise", ["then"]);
                mockSwimlane = jasmine.createSpyObj("swimlane", ["color"]);
                mockDomainObject = jasmine.createSpyObj(
                    "domainObject",
                    ["getCapability", "getId"]
                );

                mockSwimlane.domainObject = mockDomainObject;
                mockObjectLoader.load.andReturn(mockPromise);

                populator = new TimelineDragPopulator(mockObjectLoader);
            });

            it("loads timespans for the represented object's subgraph", function () {
                populator.populate(mockDomainObject);
                expect(mockObjectLoader.load).toHaveBeenCalledWith(
                    mockDomainObject,
                    'timespan'
                );
            });

            it("updates handles for selections", function () {
                // Ensure we have a represented object context
                populator.populate(mockDomainObject);
                // Initially, no selection and no handles
                expect(populator.get()).toEqual([]);
                // Select the swimlane
                populator.select(mockSwimlane);
                // We should have handles now
                expect(populator.get().length).toEqual(3);
            });

        });

    }
);