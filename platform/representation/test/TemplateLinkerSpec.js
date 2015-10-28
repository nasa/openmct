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
    ["../src/TemplateLinker"],
    function (TemplateLinker) {
        'use strict';

        var JQLITE_METHODS = [ 'replaceWith', 'empty' ];

        describe("TemplateLinker", function () {
            var mockHttp,
                mockCompile,
                mockLog,
                mockScope,
                mockElement,
                mockTemplates,
                mockElements,
                linker;

            beforeEach(function () {
                mockHttp = jasmine.createSpyObj('$http', ['get']);
                mockCompile = jasmine.createSpy('$compile');
                mockLog = jasmine.createSpyObj('$log', ['error', 'warn']);
                mockScope = jasmine.createSpyObj('$scope', ['$on']);
                mockElement = jasmine.createSpyObj('element', JQLITE_METHODS);
                mockTemplates = {};
                mockElements = {};

                mockCompile.andCallFake(function (html) {
                    mockTemplates[html] = jasmine.createSpy('template');
                    mockElements[html] =
                        jasmine.createSpyObj('templateEl', JQLITE_METHODS);
                    mockTemplates[html].andReturn(mockElements[html]);
                    return mockTemplates[html];
                });

                linker = new TemplateLinker(
                    mockHttp,
                    mockCompile,
                    mockLog
                );
            });

            describe("when linking elements", function () {
                var changeTemplate,
                    commentElement;

                function findCommentElement() {
                    mockCompile.calls.forEach(function (call) {
                        var html = call.args[0];
                        if (html.indexOf("<!--") > -1) {
                            commentElement = mockElements[html];
                        }
                    });
                }

                beforeEach(function () {
                    changeTemplate = linker.link(mockScope, mockElement);
                    findCommentElement();
                });

                it("compiles a comment to use to replace element", function () {
                    expect(commentElement).toBeDefined();
                });

                it("initially replaces elements with comments", function () {
                    expect(mockElement.replaceWith)
                        .toHaveBeenCalledWith(commentElement);
                });
            });
        });
    }
);
