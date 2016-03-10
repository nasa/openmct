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
                testUrls,
                mockRepresenters,
                mockQ,
                mockLinker,
                mockLog,
                mockChangeTemplate,
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

            function fireWatch(expr, value) {
                mockScope.$watch.calls.forEach(function (call) {
                    if (call.args[0] === expr) {
                        call.args[1](value);
                    }
                });
            }

            beforeEach(function () {
                testUrls = {};

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

                testUrls = {};
                testViews.concat(testRepresentations).forEach(function (t, i) {
                    testUrls[t.key] = "some URL " + String(i);
                });

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
                mockLinker = jasmine.createSpyObj(
                    'templateLinker',
                    ['link', 'getPath']
                );
                mockChangeTemplate = jasmine.createSpy('changeTemplate');
                mockLog = jasmine.createSpyObj("$log", LOG_FUNCTIONS);

                mockScope = jasmine.createSpyObj("scope", [ "$watch", "$on" ]);
                mockElement = jasmine.createSpyObj("element", JQLITE_FUNCTIONS);
                mockDomainObject = jasmine.createSpyObj("domainObject", DOMAIN_OBJECT_METHODS);

                mockDomainObject.getModel.andReturn(testModel);
                mockLinker.link.andReturn(mockChangeTemplate);
                mockLinker.getPath.andCallFake(function (ext) {
                    return testUrls[ext.key];
                });

                mctRepresentation = new MCTRepresentation(
                    testRepresentations,
                    testViews,
                    mockRepresenters,
                    mockQ,
                    mockLinker,
                    mockLog
                );
                mctRepresentation.link(mockScope, mockElement);
            });

            it("is restricted to elements", function () {
                expect(mctRepresentation.restrict).toEqual("E");
            });

            it("exposes templates via the templateLinker", function () {
                expect(mockLinker.link)
                    .toHaveBeenCalledWith(mockScope, mockElement);
            });

            it("watches scope when linked", function () {
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
                mockScope.key = "abc";
                mockScope.domainObject = mockDomainObject;

                // Trigger the watch
                fireWatch('key', mockScope.key);
                fireWatch('domainObject', mockDomainObject);

                expect(mockChangeTemplate)
                    .toHaveBeenCalledWith(testRepresentations[0]);
            });

            it("recognizes keys for views", function () {
                mockScope.key = "xyz";
                mockScope.domainObject = mockDomainObject;

                // Trigger the watches
                fireWatch('key', mockScope.key);
                fireWatch('domainObject', mockDomainObject);

                expect(mockChangeTemplate)
                    .toHaveBeenCalledWith(testViews[1]);
            });

            it("does not load templates until there is an object", function () {
                mockScope.key = "xyz";

                // Trigger the watch
                fireWatch('key', mockScope.key);

                expect(mockChangeTemplate)
                    .not.toHaveBeenCalledWith(jasmine.any(Object));

                mockScope.domainObject = mockDomainObject;
                fireWatch('domainObject', mockDomainObject);

                expect(mockChangeTemplate)
                    .toHaveBeenCalledWith(jasmine.any(Object));
            });

            it("loads declared capabilities", function () {
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
                mockScope.key = "someUnknownThing";

                // Verify precondition
                expect(mockLog.warn).not.toHaveBeenCalled();

                // Trigger the watch
                mockScope.$watch.calls[0].args[1]();

                // Should have gotten a warning - that's an unknown key
                expect(mockLog.warn).toHaveBeenCalled();
            });

            it("clears out obsolete peroperties from scope", function () {
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

            describe("when a domain object has been observed", function () {
                var mockContext,
                    mockContext2,
                    mockLink,
                    mockParent;

                beforeEach(function () {
                    mockContext = jasmine.createSpyObj('context', ['getPath']);
                    mockContext2 = jasmine.createSpyObj('context', ['getPath']);
                    mockLink = jasmine.createSpyObj(
                        'linkedObject',
                        DOMAIN_OBJECT_METHODS
                    );
                    mockParent = jasmine.createSpyObj(
                        'parentObject',
                        DOMAIN_OBJECT_METHODS
                    );

                    mockDomainObject.getCapability.andCallFake(function (c) {
                        return c === 'context' && mockContext;
                    });
                    mockLink.getCapability.andCallFake(function (c) {
                        return c === 'context' && mockContext2;
                    });
                    mockDomainObject.hasCapability.andCallFake(function (c) {
                        return c === 'context';
                    });
                    mockLink.hasCapability.andCallFake(function (c) {
                        return c === 'context';
                    });
                    mockLink.getModel.andReturn({});

                    mockContext.getPath.andReturn([mockDomainObject]);
                    mockContext2.getPath.andReturn([mockParent, mockLink]);

                    mockLink.getId.andReturn('test-id');
                    mockDomainObject.getId.andReturn('test-id');

                    mockParent.getId.andReturn('parent-id');

                    mockScope.key = "abc";
                    mockScope.domainObject = mockDomainObject;

                    mockScope.$watch.calls[0].args[1]();
                });

                it("detects subsequent changes among linked instances", function () {
                    var callCount = mockChangeTemplate.calls.length;

                    mockScope.domainObject = mockLink;
                    mockScope.$watch.calls[0].args[1]();

                    expect(mockChangeTemplate.calls.length)
                        .toEqual(callCount + 1);
                });

                it("does not trigger excess template changes for same instances", function () {
                    var callCount = mockChangeTemplate.calls.length;
                    mockScope.$watch.calls[0].args[1]();
                    expect(mockChangeTemplate.calls.length).toEqual(callCount);
                });
            });


        });
    }
);
