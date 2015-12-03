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

define(
    ["../../src/directives/MCTSplitPane"],
    function (MCTSplitPane) {
        'use strict';

        var JQLITE_METHODS = [
                'on',
                'addClass',
                'children',
                'eq'
            ];

        describe("The mct-split-pane directive", function () {
            var mockParse,
                mockLog,
                mockInterval,
                mctSplitPane;

            beforeEach(function () {
                mockParse = jasmine.createSpy('$parse');
                mockLog =
                    jasmine.createSpyObj('$log', ['warn', 'info', 'debug']);
                mockInterval = jasmine.createSpy('$interval');
                mockInterval.cancel = jasmine.createSpy('mockCancel');
                mctSplitPane = new MCTSplitPane(
                    mockParse,
                    mockLog,
                    mockInterval
                );
            });

            it("is only applicable as an element", function () {
                expect(mctSplitPane.restrict).toEqual("E");
            });

            describe("when its controller is applied", function () {
                var mockScope,
                    mockElement,
                    testAttrs,
                    mockChildren,
                    controller;

                beforeEach(function () {
                    mockScope =
                        jasmine.createSpyObj('$scope', ['$apply', '$watch', '$on']);
                    mockElement =
                        jasmine.createSpyObj('element', JQLITE_METHODS);
                    testAttrs = {};
                    mockChildren =
                        jasmine.createSpyObj('children', JQLITE_METHODS);

                    mockElement.children.andReturn(mockChildren);
                    mockChildren.eq.andReturn(mockChildren);
                    mockChildren[0] = {};

                    controller = mctSplitPane.controller[3](
                        mockScope,
                        mockElement,
                        testAttrs
                    );
                });

                it("sets an interval which does not trigger digests", function () {
                    expect(mockInterval.mostRecentCall.args[3]).toBe(false);
                });

            });

        });

    }
);