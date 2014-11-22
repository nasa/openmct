/*global define,Promise,describe,it,expect,beforeEach,waitsFor,jasmine*/

/**
 * GestureProviderSpec. Created by vwoeltje on 11/6/14.
 */
define(
    ["../../src/gestures/GestureProvider"],
    function (GestureProvider) {
        "use strict";

        var JQLITE_FUNCTIONS = [ "on", "off", "attr", "removeAttr" ],
            GESTURE_KEYS = ["a", "b", "c", "d", "e"],
            DOMAIN_OBJECT_METHODS = [ "getId", "getModel", "getCapability", "hasCapability", "useCapability"];

        describe("The gesture provider", function () {
            var mockGestures,
                mockDestroys,
                mockElement,
                mockDomainObject,
                provider;

            beforeEach(function () {
                mockElement = jasmine.createSpyObj("element", JQLITE_FUNCTIONS);
                mockDomainObject = jasmine.createSpyObj("domainObject", DOMAIN_OBJECT_METHODS);

                mockDestroys = {};
                mockGestures = {};
                GESTURE_KEYS.forEach(function (key) {
                    mockDestroys[key] = jasmine.createSpy("destroy-" + key);
                    mockGestures[key] = jasmine.createSpy("gesture-" + key);
                    mockGestures[key].andReturn({ destroy: mockDestroys[key] });
                    mockGestures[key].key = key;
                });

                provider = new GestureProvider(GESTURE_KEYS.map(function (key) {
                    return mockGestures[key];
                }));
            });

            it("attaches matching to an element", function () {
                provider.attachGestures(mockElement, mockDomainObject, ["a", "c", "e"]);

                expect(mockGestures.a).toHaveBeenCalledWith(mockElement, mockDomainObject);
                expect(mockGestures.c).toHaveBeenCalledWith(mockElement, mockDomainObject);
                expect(mockGestures.e).toHaveBeenCalledWith(mockElement, mockDomainObject);
                expect(mockGestures.b).not.toHaveBeenCalled();
                expect(mockGestures.d).not.toHaveBeenCalled();

                // No destroys should have been called - let's check
                GESTURE_KEYS.forEach(function (key) {
                    expect(mockDestroys[key]).not.toHaveBeenCalled();
                });
            });

            it("detaches gestures on request", function () {
                provider.attachGestures(
                    mockElement,
                    mockDomainObject,
                    ["b", "d", "e"]
                ).destroy();

                expect(mockDestroys.b).toHaveBeenCalled();
                expect(mockDestroys.d).toHaveBeenCalled();
                expect(mockDestroys.e).toHaveBeenCalled();
                expect(mockDestroys.a).not.toHaveBeenCalled();
                expect(mockDestroys.c).not.toHaveBeenCalled();
            });
        });
    }
);