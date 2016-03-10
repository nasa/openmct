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
                'eq',
                'toggleClass',
                'css'
            ];

        describe("The mct-split-pane directive", function () {
            var mockParse,
                mockLog,
                mockInterval,
                mockParsed,
                mctSplitPane;

            beforeEach(function () {
                mockParse = jasmine.createSpy('$parse');
                mockLog =
                    jasmine.createSpyObj('$log', ['warn', 'info', 'debug']);
                mockInterval = jasmine.createSpy('$interval');
                mockInterval.cancel = jasmine.createSpy('mockCancel');
                mockParsed = jasmine.createSpy('parsed');
                mockParsed.assign = jasmine.createSpy('assign');

                mockParse.andReturn(mockParsed);

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
                    mockFirstPane,
                    mockSplitter,
                    mockSecondPane,
                    controller;

                function fireOn(eventType) {
                    mockScope.$on.calls.forEach(function (call) {
                        if (call.args[0] === eventType) {
                            call.args[1]();
                        }
                    });
                }

                beforeEach(function () {
                    mockScope =
                        jasmine.createSpyObj('$scope', ['$apply', '$watch', '$on']);
                    mockElement =
                        jasmine.createSpyObj('element', JQLITE_METHODS);
                    testAttrs = {};
                    mockChildren =
                        jasmine.createSpyObj('children', JQLITE_METHODS);
                    mockFirstPane =
                        jasmine.createSpyObj('firstPane', JQLITE_METHODS);
                    mockSplitter =
                        jasmine.createSpyObj('splitter', JQLITE_METHODS);
                    mockSecondPane =
                        jasmine.createSpyObj('secondPane', JQLITE_METHODS);

                    mockElement.children.andReturn(mockChildren);
                    mockElement[0] = {
                        offsetWidth: 12321,
                        offsetHeight: 45654
                    };
                    mockChildren.eq.andCallFake(function (i) {
                        return [mockFirstPane, mockSplitter, mockSecondPane][i];
                    });
                    mockFirstPane[0] = { offsetWidth: 123, offsetHeight: 456 };
                    mockSplitter[0] = {
                        nodeName: 'mct-splitter',
                        offsetWidth: 10,
                        offsetHeight: 456
                    };
                    mockSecondPane[0] = { offsetWidth: 10, offsetHeight: 456 };

                    mockChildren[0] = mockFirstPane[0];
                    mockChildren[1] = mockSplitter[0];
                    mockChildren[3] = mockSecondPane[0];
                    mockChildren.length = 3;

                    controller = mctSplitPane.controller[3](
                        mockScope,
                        mockElement,
                        testAttrs
                    );
                });

                it("sets an interval which does not trigger digests", function () {
                    expect(mockInterval.mostRecentCall.args[3]).toBe(false);
                });

                it("exposes its splitter's initial position", function () {
                    expect(controller.position()).toEqual(
                        mockFirstPane[0].offsetWidth + mockSplitter[0].offsetWidth
                    );
                });

                it("exposes the current anchoring mode", function () {
                    expect(controller.anchor()).toEqual({
                        edge : 'left',
                        opposite : 'right',
                        dimension : 'width',
                        orientation : 'vertical'
                    });
                });

                it("allows classes to be toggled on contained elements", function () {
                    controller.toggleClass('resizing');
                    expect(mockChildren.toggleClass)
                        .toHaveBeenCalledWith('resizing');
                });

                it("allows positions to be set", function () {
                    var testValue = mockChildren[0].offsetWidth + 50;
                    controller.position(testValue);
                    expect(mockFirstPane.css).toHaveBeenCalledWith(
                        'width',
                        (testValue - mockSplitter[0].offsetWidth) + 'px'
                    );
                });

                it("issues no warnings under nominal usage", function () {
                    expect(mockLog.warn).not.toHaveBeenCalled();
                });

                it("warns if no mct-splitter is present", function () {
                    mockSplitter[0].nodeName = "not-mct-splitter";
                    controller = mctSplitPane.controller[3](
                        mockScope,
                        mockElement,
                        testAttrs
                    );
                    expect(mockLog.warn).toHaveBeenCalled();
                });

                it("warns if an unknown anchor key is given", function () {
                    testAttrs.anchor = "middle";
                    controller = mctSplitPane.controller[3](
                        mockScope,
                        mockElement,
                        testAttrs
                    );
                    expect(mockLog.warn).toHaveBeenCalled();
                });

                it("updates positions on a timer", function () {
                    mockFirstPane[0].offsetWidth += 100;
                    // Should not reflect the change yet
                    expect(controller.position()).not.toEqual(
                        mockFirstPane[0].offsetWidth + mockSplitter[0].offsetWidth
                    );
                    mockInterval.mostRecentCall.args[0]();
                    expect(controller.position()).toEqual(
                        mockFirstPane[0].offsetWidth + mockSplitter[0].offsetWidth
                    );
                });

                it("cancels the active interval when scope is destroyed", function () {
                    expect(mockInterval.cancel).not.toHaveBeenCalled();
                    fireOn('$destroy');
                    expect(mockInterval.cancel).toHaveBeenCalled();
                });
            });

        });

    }
);