/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2016, United States Government
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

define(
    ["../../src/directives/MCTSplitPane"],
    (MCTSplitPane) => {

        const JQLITE_METHODS = [
                'on',
                'addClass',
                'children',
                'eq',
                'toggleClass',
                'css'
            ];

        describe("The mct-split-pane directive", () => {
            let mockParse,
                mockLog,
                mockInterval,
                mockParsed,
                mctSplitPane;

            beforeEach( () => {
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

            it("is only applicable as an element", () => {
                expect(mctSplitPane.restrict).toEqual("E");
            });

            describe("when its controller is applied", () => {
                let mockScope,
                    mockElement,
                    testAttrs,
                    mockChildren,
                    mockFirstPane,
                    mockSplitter,
                    mockSecondPane,
                    controller;

                const fireOn = (eventType) => {
                    mockScope.$on.calls.forEach( (call) => {
                        if (call.args[0] === eventType) {
                            call.args[1]();
                        }
                    });
                }

                beforeEach( () => {
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
                    mockChildren.eq.andCallFake( (i) => {
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

                it("sets an interval which does not trigger digests", () => {
                    expect(mockInterval.mostRecentCall.args[3]).toBe(false);
                });

                it("exposes its splitter's initial position", () => {
                    expect(controller.position()).toEqual(
                        mockFirstPane[0].offsetWidth + mockSplitter[0].offsetWidth
                    );
                });

                it("exposes the current anchoring mode", () => {
                    expect(controller.anchor()).toEqual({
                        edge : 'left',
                        opposite : 'right',
                        dimension : 'width',
                        orientation : 'vertical'
                    });
                });

                it("allows classes to be toggled on contained elements", () => {
                    controller.toggleClass('resizing');
                    expect(mockChildren.toggleClass)
                        .toHaveBeenCalledWith('resizing');
                });

                it("allows positions to be set", () => {
                    let testValue = mockChildren[0].offsetWidth + 50;
                    controller.position(testValue);
                    expect(mockFirstPane.css).toHaveBeenCalledWith(
                        'width',
                        (testValue - mockSplitter[0].offsetWidth) + 'px'
                    );
                });

                it("issues no warnings under nominal usage", () => {
                    expect(mockLog.warn).not.toHaveBeenCalled();
                });

                it("warns if no mct-splitter is present", () => {
                    mockSplitter[0].nodeName = "not-mct-splitter";
                    controller = mctSplitPane.controller[3](
                        mockScope,
                        mockElement,
                        testAttrs
                    );
                    expect(mockLog.warn).toHaveBeenCalled();
                });

                it("warns if an unknown anchor key is given", () => {
                    testAttrs.anchor = "middle";
                    controller = mctSplitPane.controller[3](
                        mockScope,
                        mockElement,
                        testAttrs
                    );
                    expect(mockLog.warn).toHaveBeenCalled();
                });

                it("updates positions on a timer", () => {
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

                it("cancels the active interval when scope is destroyed", () => {
                    expect(mockInterval.cancel).not.toHaveBeenCalled();
                    fireOn('$destroy');
                    expect(mockInterval.cancel).toHaveBeenCalled();
                });
            });

        });

    }
);
