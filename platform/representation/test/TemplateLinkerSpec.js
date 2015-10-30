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

        var JQLITE_METHODS = [ 'replaceWith', 'empty', 'append' ],
            SCOPE_METHODS = [ '$on', '$new', '$destroy' ];

        describe("TemplateLinker", function () {
            var mockTemplateRequest,
                mockSce,
                mockCompile,
                mockLog,
                mockScope,
                mockElement,
                mockTemplates,
                mockElements,
                mockNewScope,
                mockPromise,
                linker;

            beforeEach(function () {
                mockTemplateRequest = jasmine.createSpy('$templateRequest');
                mockSce = jasmine.createSpyObj('$sce', ['trustAsResourceUrl']);
                mockCompile = jasmine.createSpy('$compile');
                mockLog = jasmine.createSpyObj('$log', ['error', 'warn']);
                mockScope = jasmine.createSpyObj('$scope', SCOPE_METHODS);
                mockNewScope = jasmine.createSpyObj('$scope', SCOPE_METHODS);
                mockElement = jasmine.createSpyObj('element', JQLITE_METHODS);
                mockPromise = jasmine.createSpyObj('promise', ['then']);
                mockTemplates = {};
                mockElements = {};

                mockTemplateRequest.andReturn(mockPromise);
                mockCompile.andCallFake(function (html) {
                    mockTemplates[html] = jasmine.createSpy('template');
                    mockElements[html] =
                        jasmine.createSpyObj('templateEl', JQLITE_METHODS);
                    mockTemplates[html].andReturn(mockElements[html]);
                    return mockTemplates[html];
                });
                mockSce.trustAsResourceUrl.andCallFake(function (url) {
                    return { trusted: url };
                });
                mockScope.$new.andReturn(mockNewScope);

                linker = new TemplateLinker(
                    mockTemplateRequest,
                    mockSce,
                    mockCompile,
                    mockLog
                );
            });

            it("resolves extension paths", function () {
                expect(linker.getPath({
                    bundle: {
                        path: 'a',
                        resources: 'b'
                    },
                    templateUrl: 'c/d.html'
                })).toEqual('a/b/c/d.html');
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

                it("provides a function to change templates", function () {
                    expect(changeTemplate).toEqual(jasmine.any(Function));
                });

                describe("and then changing templates", function () {
                    var testUrl,
                        testTemplate;

                    beforeEach(function () {
                        testUrl = "some/url/template.html";
                        testTemplate = "<div>Some template!</div>";
                        changeTemplate(testUrl);
                        mockPromise.then.mostRecentCall
                            .args[0](testTemplate);
                    });

                    it("loads templates using $templateRequest", function () {
                        expect(mockTemplateRequest).toHaveBeenCalledWith({
                            trusted: testUrl
                        }, false);
                    });

                    it("compiles loaded templates with a new scope", function () {
                        expect(mockCompile).toHaveBeenCalledWith(testTemplate);
                        expect(mockTemplates[testTemplate])
                            .toHaveBeenCalledWith(mockNewScope);
                    });

                    it("replaces comments with specified element", function () {
                        expect(commentElement.replaceWith)
                            .toHaveBeenCalledWith(mockElement);
                    });

                    it("appends rendered content to the specified element", function () {
                        expect(mockElement.append)
                            .toHaveBeenCalledWith(mockElements[testTemplate]);
                    });

                    it("clears templates when called with undefined", function () {
                        expect(mockElement.replaceWith.callCount)
                            .toEqual(1);
                        changeTemplate(undefined);
                        expect(mockElement.replaceWith.callCount)
                            .toEqual(2);
                        expect(mockElement.replaceWith.mostRecentCall.args[0])
                            .toEqual(commentElement);
                    });

                    it("logs no warnings for nominal changes", function () {
                        expect(mockLog.warn).not.toHaveBeenCalled();
                    });

                    describe("which cannot be found", function () {
                        beforeEach(function () {
                            changeTemplate("some/bad/url");
                            // Reject the template promise
                            mockPromise.then.mostRecentCall.args[1]();
                        });

                        it("removes the element from the DOM", function () {
                            expect(mockElement.replaceWith.callCount)
                                .toEqual(2);
                            expect(
                                mockElement.replaceWith.mostRecentCall.args[0]
                            ).toEqual(commentElement);
                        });

                        it("logs a warning", function () {
                            expect(mockLog.warn)
                                .toHaveBeenCalledWith(jasmine.any(String));
                        });

                    });
                });

            });

            describe("when an initial template URL is provided", function () {
                var testUrl;

                beforeEach(function () {
                    testUrl = "some/test/url.html";
                    linker.link(mockScope, mockElement, testUrl);
                });

                it("does not remove the element initially", function () {
                    expect(mockElement.replaceWith)
                        .not.toHaveBeenCalled();
                });

                it("loads the specified template", function () {
                    expect(mockTemplateRequest).toHaveBeenCalledWith({
                        trusted: testUrl
                    }, false);
                });
            });

        });
    }
);
