/*****************************************************************************
 * Open MCT Web, Copyright (c) 2014-2015, United States Government
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
/*global define,Promise,describe,it,expect,beforeEach,waitsFor,jasmine*/

/**
 * MergeModelsSpec. Created by vwoeltje on 11/6/14.
 */
define(
    ["../../src/modes/PlotModeOptions"],
    function (PlotModeOptions) {
        "use strict";

        describe("Plot mode options", function () {
            var mockDomainObject,
                mockSubPlotFactory;

            beforeEach(function () {
                mockDomainObject = jasmine.createSpyObj(
                    "domainObject",
                    [ "getId", "getModel", "getCapability" ]
                );
                mockSubPlotFactory = jasmine.createSpyObj(
                    "subPlotFactory",
                    [ "createSubPlot" ]
                );
            });

            it("offers only one option when one object is present", function () {
                expect(
                    new PlotModeOptions([mockDomainObject], mockSubPlotFactory)
                            .getModeOptions().length
                ).toEqual(1);
            });

            it("offers two options when multiple objects are present", function () {
                var objects = [
                        mockDomainObject,
                        mockDomainObject,
                        mockDomainObject,
                        mockDomainObject
                    ];
                expect(
                    new PlotModeOptions(objects, mockSubPlotFactory)
                            .getModeOptions().length
                ).toEqual(2);
            });

            it("allows modes to be changed", function () {
                var plotModeOptions = new PlotModeOptions([
                        mockDomainObject,
                        mockDomainObject,
                        mockDomainObject,
                        mockDomainObject
                    ], mockSubPlotFactory),
                    initialHandler = plotModeOptions.getModeHandler();

                // Change the mode
                plotModeOptions.getModeOptions().forEach(function (option) {
                    if (option !== plotModeOptions.getMode()) {
                        plotModeOptions.setMode(option);
                    }
                });

                // Mode should be different now
                expect(plotModeOptions.getModeHandler())
                    .not.toBe(initialHandler);
            });
        });
    }
);