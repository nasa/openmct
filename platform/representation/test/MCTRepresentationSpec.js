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
 * MCTRepresentationSpec. Created by vwoeltje on 11/6/14.
 */
define(
    ["../src/MCTRepresentation"],
    function (MCTRepresentation) {
        "use strict";

        var JQLITE_FUNCTIONS = [ "on", "off", "attr", "removeAttr" ],
            LOG_FUNCTIONS = [ "error", "warn", "info", "debug"],
            DOMAIN_OBJECT_METHODS = [ "getId", "getModel", "getCapability", "hasCapability", "useCapability"];

        describe("The mct-representation directive", function () {
            var testRepresentations,
                testViews,
                mockRepresenters,
                mockQ,
                mockSce,
                mockLog,
                mockScope,
                mockElement,
                mockDomainObject,
                testModel,
                mctRepresentation;

            function mockPromise(value) {
                return (value && value.then) ? value : {
                    then: function (callback) {
                        return mockPromise(callback(value));
                    }
                };
            }

            beforeEach(function () {
                testRepresentations = [
                    {
                        key: "abc",
                        bundle: { path: "a", resources: "b" },
                        templateUrl: "c/template.html"
                    },
                    {
                        key: "def",
                        bundle: { path: "d", resources: "e" },
                        templateUrl: "f/template.html",
                        uses: [ "testCapability", "otherTestCapability" ]
                    }
                ];

                testViews = [
                    {
                        key: "uvw",
                        bundle: { path: "u", resources: "v" },
                        templateUrl: "w/template.html",
                        gestures: [ "testGesture", "otherTestGesture" ]
                    },
                    {
                        key: "xyz",
                        bundle: { path: "x", resources: "y" },
                        templateUrl: "z/template.html"
                    }
                ];

                testModel = { someKey: "some value" };

                mockRepresenters = ["A", "B"].map(function (name) {
                    var constructor = jasmine.createSpy("Representer" + name),
                        representer = jasmine.createSpyObj(
                            "representer" + name,
                            [ "represent", "destroy" ]
                        );
                    constructor.andReturn(representer);
                    return constructor;
                });

                mockQ = { when: mockPromise };
                mockSce = jasmine.createSpyObj(
                    '$sce',
                    ['trustAsResourceUrl']
                );
                mockLog = jasmine.createSpyObj("$log", LOG_FUNCTIONS);


                mockSce.trustAsResourceUrl.andCallFake(function (url) {
                    return url;
                });
                mockScope = jasmine.createSpyObj("scope", [ "$watch", "$on" ]);
                mockElement = jasmine.createSpyObj("element", JQLITE_FUNCTIONS);
                mockDomainObject = jasmine.createSpyObj("domainObject", DOMAIN_OBJECT_METHODS);

                mockDomainObject.getModel.andReturn(testModel);

                mctRepresentation = new MCTRepresentation(
                    testRepresentations,
                    testViews,
                    mockRepresenters,
                    mockQ,
                    mockSce,
                    mockLog
                );
            });


            it("has a built-in template, with ng-include src=inclusion", function () {
                // Not rigorous, but should detect many cases when template is broken.
                expect(mctRepresentation.template.indexOf("ng-include")).not.toEqual(-1);
                expect(mctRepresentation.template.indexOf("inclusion")).not.toEqual(-1);
            });

            it("is restricted to elements", function () {
                expect(mctRepresentation.restrict).toEqual("E");
            });

            it("watches scope when linked", function () {
                mctRepresentation.link(mockScope, mockElement);
                expect(mockScope.$watch).toHaveBeenCalledWith(
                    "key",
                    jasmine.any(Function)
                );
                expect(mockScope.$watch).toHaveBeenCalledWith(
                    "domainObject",
                    jasmine.any(Function)
                );
                expect(mockScope.$watch).toHaveBeenCalledWith(
                    "domainObject.getModel().modified",
                    jasmine.any(Function)
                );
            });

            it("recognizes keys for representations", function () {
                mctRepresentation.link(mockScope, mockElement);

                mockScope.key = "abc";

                // Trigger the watch
                mockScope.$watch.calls[0].args[1]();

                expect(mockScope.inclusion).toEqual("a/b/c/template.html");
            });

            it("recognizes keys for views", function () {
                mctRepresentation.link(mockScope, mockElement);

                mockScope.key = "xyz";

                // Trigger the watch
                mockScope.$watch.calls[0].args[1]();

                expect(mockScope.inclusion).toEqual("x/y/z/template.html");
            });

            it("trusts template URLs", function () {
                mctRepresentation.link(mockScope, mockElement);

                mockScope.key = "xyz";

                // Trigger the watch
                mockScope.$watch.calls[0].args[1]();

                expect(mockSce.trustAsResourceUrl)
                    .toHaveBeenCalledWith("x/y/z/template.html");
            });

            it("loads declared capabilities", function () {
                mctRepresentation.link(mockScope, mockElement);

                mockScope.key = "def";
                mockScope.domainObject = mockDomainObject;

                // Trigger the watch
                mockScope.$watch.calls[0].args[1]();

                expect(mockDomainObject.useCapability)
                    .toHaveBeenCalledWith("testCapability");
                expect(mockDomainObject.useCapability)
                    .toHaveBeenCalledWith("otherTestCapability");
            });

            it("logs when no representation is available for a key", function () {
                mctRepresentation.link(mockScope, mockElement);

                mockScope.key = "someUnknownThing";

                // Verify precondition
                expect(mockLog.warn).not.toHaveBeenCalled();

                // Trigger the watch
                mockScope.$watch.calls[0].args[1]();

                // Should have gotten a warning - that's an unknown key
                expect(mockLog.warn).toHaveBeenCalled();
            });

            it("clears out obsolete peroperties from scope", function () {
                mctRepresentation.link(mockScope, mockElement);

                mockScope.key = "def";
                mockScope.domainObject = mockDomainObject;
                mockDomainObject.useCapability.andReturn("some value");

                // Trigger the watch
                mockScope.$watch.calls[0].args[1]();
                expect(mockScope.testCapability).toBeDefined();

                // Change the view
                mockScope.key = "xyz";

                // Trigger the watch again; should clear capability from scope
                mockScope.$watch.calls[0].args[1]();
                expect(mockScope.testCapability).toBeUndefined();
            });
        });
    }
);
