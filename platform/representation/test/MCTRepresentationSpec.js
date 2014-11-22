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
                mockGestureService,
                mockGestureHandle,
                mockQ,
                mockLog,
                mockScope,
                mockElement,
                mockDomainObject,
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

                mockGestureService = jasmine.createSpyObj("gestureService", [ "attachGestures" ]);
                mockGestureHandle = jasmine.createSpyObj("gestureHandle", [ "destroy" ]);

                mockGestureService.attachGestures.andReturn(mockGestureHandle);

                mockQ = { when: mockPromise };
                mockLog = jasmine.createSpyObj("$log", LOG_FUNCTIONS);

                mockScope = jasmine.createSpyObj("scope", [ "$watch" ]);
                mockElement = jasmine.createSpyObj("element", JQLITE_FUNCTIONS);
                mockDomainObject = jasmine.createSpyObj("domainObject", DOMAIN_OBJECT_METHODS);

                mctRepresentation = new MCTRepresentation(
                    testRepresentations,
                    testViews,
                    mockGestureService,
                    mockQ,
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
                expect(mockScope.$watch).toHaveBeenCalledWith("key", jasmine.any(Function));
                expect(mockScope.$watch).toHaveBeenCalledWith("domainObject", jasmine.any(Function));
                expect(mockScope.$watch).toHaveBeenCalledWith("domainObject.getModel().modified", jasmine.any(Function));
            });

            it("recognizes keys for representations", function () {
                mctRepresentation.link(mockScope, mockElement);

                mockScope.key = "abc";

                // Trigger the watch
                mockScope.$watch.mostRecentCall.args[1]();

                expect(mockScope.inclusion).toEqual("a/b/c/template.html");
            });

            it("recognizes keys for views", function () {
                mctRepresentation.link(mockScope, mockElement);

                mockScope.key = "xyz";

                // Trigger the watch
                mockScope.$watch.mostRecentCall.args[1]();

                expect(mockScope.inclusion).toEqual("x/y/z/template.html");
            });

            it("loads declared capabilities", function () {
                mctRepresentation.link(mockScope, mockElement);

                mockScope.key = "def";
                mockScope.domainObject = mockDomainObject;

                // Trigger the watch
                mockScope.$watch.mostRecentCall.args[1]();

                expect(mockDomainObject.useCapability)
                    .toHaveBeenCalledWith("testCapability");
                expect(mockDomainObject.useCapability)
                    .toHaveBeenCalledWith("otherTestCapability");
            });

            it("attaches declared gestures, and detaches on refresh", function () {
                mctRepresentation.link(mockScope, mockElement);

                mockScope.key = "uvw";
                mockScope.domainObject = mockDomainObject;

                // Trigger the watch
                mockScope.$watch.mostRecentCall.args[1]();

                expect(mockGestureService.attachGestures).toHaveBeenCalledWith(
                    mockElement,
                    mockDomainObject,
                    [ "testGesture", "otherTestGesture" ]
                );

                expect(mockGestureHandle.destroy).not.toHaveBeenCalled();

                // Refresh, expect a detach
                mockScope.key = "abc";
                mockScope.$watch.mostRecentCall.args[1]();

                // Should have destroyed those old gestures
                expect(mockGestureHandle.destroy).toHaveBeenCalled();
            });


            it("logs when no representation is available for a key", function () {
                mctRepresentation.link(mockScope, mockElement);

                mockScope.key = "someUnknownThing";

                // Verify precondition
                expect(mockLog.warn).not.toHaveBeenCalled();

                // Trigger the watch
                mockScope.$watch.mostRecentCall.args[1]();

                // Should have gotten a warning - that's an unknown key
                expect(mockLog.warn).toHaveBeenCalled();
            });
        });
    }
);