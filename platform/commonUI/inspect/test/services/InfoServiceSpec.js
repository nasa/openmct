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
    ['../../src/services/InfoService', '../../src/InfoConstants'],
    function (InfoService, InfoConstants) {
        "use strict";

        describe("The info service", function () {
            var mockCompile,
                mockDocument,
                testWindow,
                mockRootScope,
                mockCompiledTemplate,
                testScope,
                mockBody,
                mockElement,
                service;

            beforeEach(function () {
                mockCompile = jasmine.createSpy('$compile');
                mockDocument = jasmine.createSpyObj('$document', ['find']);
                testWindow = { innerWidth: 1000, innerHeight: 100 };
                mockRootScope = jasmine.createSpyObj('$rootScope', ['$new']);
                mockCompiledTemplate = jasmine.createSpy('template');
                testScope = {};
                mockBody = jasmine.createSpyObj('body', ['append']);
                mockElement = jasmine.createSpyObj('element', ['css', 'remove']);

                mockDocument.find.andCallFake(function (tag) {
                    return tag === 'body' ? mockBody : undefined;
                });
                mockCompile.andReturn(mockCompiledTemplate);
                mockCompiledTemplate.andReturn(mockElement);
                mockRootScope.$new.andReturn(testScope);

                service = new InfoService(
                    mockCompile,
                    mockDocument,
                    testWindow,
                    mockRootScope
                );
            });

            it("creates elements and appends them to the body to display", function () {
                service.display('', '', {}, [0, 0]);
                expect(mockBody.append).toHaveBeenCalledWith(mockElement);
            });

            it("provides a function to remove displayed info bubbles", function () {
                var fn = service.display('', '', {}, [0, 0]);
                expect(mockElement.remove).not.toHaveBeenCalled();
                fn();
                expect(mockElement.remove).toHaveBeenCalled();
            });

            describe("depending on mouse position", function () {
                // Positioning should vary based on quadrant in window,
                // which is 1000 x 100 in this test case.
                it("displays from the top-left in the top-left quadrant", function () {
                    service.display('', '', {}, [250, 25]);
                    expect(mockElement.css).toHaveBeenCalledWith(
                        'left',
                        (250 + InfoConstants.BUBBLE_OFFSET[0]) + 'px'
                    );
                    expect(mockElement.css).toHaveBeenCalledWith(
                        'top',
                        (25 + InfoConstants.BUBBLE_OFFSET[1]) + 'px'
                    );
                });

                it("displays from the top-right in the top-right quadrant", function () {
                    service.display('', '', {}, [700, 25]);
                    expect(mockElement.css).toHaveBeenCalledWith(
                        'right',
                        (300 + InfoConstants.BUBBLE_OFFSET[0]) + 'px'
                    );
                    expect(mockElement.css).toHaveBeenCalledWith(
                        'top',
                        (25 + InfoConstants.BUBBLE_OFFSET[1]) + 'px'
                    );
                });

                it("displays from the bottom-left in the bottom-left quadrant", function () {
                    service.display('', '', {}, [250, 70]);
                    expect(mockElement.css).toHaveBeenCalledWith(
                        'left',
                        (250 + InfoConstants.BUBBLE_OFFSET[0]) + 'px'
                    );
                    expect(mockElement.css).toHaveBeenCalledWith(
                        'bottom',
                        (30 + InfoConstants.BUBBLE_OFFSET[1]) + 'px'
                    );
                });

                it("displays from the bottom-right in the bottom-right quadrant", function () {
                    service.display('', '', {}, [800, 60]);
                    expect(mockElement.css).toHaveBeenCalledWith(
                        'right',
                        (200 + InfoConstants.BUBBLE_OFFSET[0]) + 'px'
                    );
                    expect(mockElement.css).toHaveBeenCalledWith(
                        'bottom',
                        (40 + InfoConstants.BUBBLE_OFFSET[1]) + 'px'
                    );
                });
            });

        });
    }
);