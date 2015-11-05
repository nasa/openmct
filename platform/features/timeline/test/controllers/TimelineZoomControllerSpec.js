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
    ['../../src/controllers/TimelineZoomController'],
    function (TimelineZoomController) {
        'use strict';

        describe("The timeline zoom state controller", function () {
            var testConfiguration,
                mockScope,
                controller;

            beforeEach(function () {
                testConfiguration = {
                    levels: [
                        1000,
                        2000,
                        3500
                    ],
                    width: 12321
                };
                mockScope = jasmine.createSpyObj("$scope", ['$watch']);
                mockScope.commit = jasmine.createSpy('commit');
                controller = new TimelineZoomController(
                    mockScope,
                    testConfiguration
                );
            });

            it("starts off at a middle zoom level", function () {
                expect(controller.zoom()).toEqual(2000);
            });

            it("allows duration to be changed", function () {
                var initial = controller.duration();
                controller.duration(initial * 3.33);
                expect(controller.duration() > initial).toBeTruthy();
            });

            it("handles time-to-pixel conversions", function () {
                var zoomLevel = controller.zoom();
                expect(controller.toPixels(zoomLevel)).toEqual(12321);
                expect(controller.toPixels(zoomLevel * 2)).toEqual(24642);
            });

            it("handles pixel-to-time conversions", function () {
                var zoomLevel = controller.zoom();
                expect(controller.toMillis(12321)).toEqual(zoomLevel);
                expect(controller.toMillis(24642)).toEqual(zoomLevel * 2);
            });

            it("allows zoom to be changed", function () {
                controller.zoom(1);
                expect(controller.zoom()).toEqual(3500);
            });

            it("does not normally persist zoom changes", function () {
                controller.zoom(1);
                expect(mockScope.commit).not.toHaveBeenCalled();
            });

            it("persists zoom changes in Edit mode", function () {
                mockScope.domainObject = jasmine.createSpyObj(
                    'domainObject',
                    ['hasCapability']
                );
                mockScope.domainObject.hasCapability.andCallFake(function (c) {
                    return c === 'editor';
                });
                controller.zoom(1);
                expect(mockScope.commit).toHaveBeenCalled();
                expect(mockScope.configuration.zoomLevel)
                    .toEqual(jasmine.any(Number));
            });

        });

    }
);
