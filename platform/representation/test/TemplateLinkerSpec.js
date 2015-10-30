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

        var JQLITE_METHODS = [ 'replaceWith', 'empty', 'append' ];

        describe("TemplateLinker", function () {
            var mockHttp,
                mockCompile,
                mockLog,
                mockScope,
                mockElement,
                mockTemplates,
                mockElements,
                mockHttpPromise,
                mockChainPromise,
                linker;

            beforeEach(function () {
                mockHttp = jasmine.createSpyObj('$http', ['get']);
                mockCompile = jasmine.createSpy('$compile');
                mockLog = jasmine.createSpyObj('$log', ['error', 'warn']);
                mockScope = jasmine.createSpyObj('$scope', ['$on']);
                mockElement = jasmine.createSpyObj('element', JQLITE_METHODS);
                mockHttpPromise = jasmine.createSpyObj('promise1', ['then']);
                mockChainPromise = jasmine.createSpyObj('promise2', ['then']);
                mockTemplates = {};
                mockElements = {};

                mockHttp.get.andReturn(mockHttpPromise);
                mockHttpPromise.then.andReturn(mockChainPromise);
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
                    });

                    it("loads templates using $http", function () {
                        expect(mockHttp.get).toHaveBeenCalledWith(testUrl);
                    });

                    it("compiles loaded templates with linked scope", function () {
                        var chainValue;
                        chainValue = mockHttpPromise.then.mostRecentCall.args[0]({
                            data: testTemplate
                        });
                        expect(mockCompile).toHaveBeenCalledWith(testTemplate);
                        mockChainPromise.then.mostRecentCall.args[0](chainValue);
                        expect(mockTemplates[testTemplate]).toHaveBeenCalledWith(
                            mockScope,
                            jasmine.any(Function)
                        );
                    });

                    it("replaces comments with specified element", function () {
                        mockChainPromise.then.mostRecentCall.args[0](
                            mockHttpPromise.then.mostRecentCall.args[0]({
                                data: testTemplate
                            })
                        );
                        expect(commentElement.replaceWith)
                            .toHaveBeenCalledWith(mockElement);
                    });

                    it("appends rendered content to the specified element", function () {
                        mockChainPromise.then.mostRecentCall.args[0](
                            mockHttpPromise.then.mostRecentCall.args[0]({
                                data: testTemplate
                            })
                        );
                        mockTemplates[testTemplate].mostRecentCall.args[1](
                            mockElements[testTemplate]
                        );
                        expect(mockElement.append)
                            .toHaveBeenCalledWith(mockElements[testTemplate]);
                    });

                    it("clears templates when called with undefined", function () {
                        expect(mockElement.replaceWith.callCount)
                            .toEqual(1);
                        mockChainPromise.then.mostRecentCall.args[0](
                            mockHttpPromise.then.mostRecentCall.args[0]({
                                data: testTemplate
                            })
                        );
                        changeTemplate(undefined);
                        expect(mockElement.replaceWith.callCount)
                            .toEqual(2);
                        expect(mockElement.replaceWith.mostRecentCall.args[0])
                            .toEqual(commentElement);
                    });

                    it("logs no warnings", function () {
                        mockChainPromise.then.mostRecentCall.args[0](
                            mockHttpPromise.then.mostRecentCall.args[0]({
                                data: testTemplate
                            })
                        );
                        mockTemplates[testTemplate].mostRecentCall.args[1](
                            mockElements[testTemplate]
                        );
                        expect(mockLog.warn).not.toHaveBeenCalled();
                    });

                    describe("which cannot be found", function () {
                        beforeEach(function () {
                            mockChainPromise.then.mostRecentCall.args[0](
                                // Reject the http promise
                                mockHttpPromise.then.mostRecentCall.args[1]()
                            );
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
                    expect(mockHttp.get).toHaveBeenCalledWith(testUrl);
                });
            });

            it("does not issue multiple requests for the same URL", function () {
                var testUrls = ['a', 'b', 'c', 'd'].map(function (k) {
                        return k + "/some/template.html";
                    });

                testUrls.forEach(function (testUrl, i) {
                    expect(mockHttp.get.callCount).toEqual(i);
                    linker.link(mockScope, mockElement, testUrl);
                    expect(mockHttp.get.callCount).toEqual(i + 1);
                    linker.link(mockScope, mockElement, testUrl);
                    expect(mockHttp.get.callCount).toEqual(i + 1);
                    linker.link(mockScope, mockElement)(testUrl);
                    expect(mockHttp.get.callCount).toEqual(i + 1);
                });
            });
        });
    }
);
