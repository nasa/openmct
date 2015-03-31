/*global define,Promise,describe,it,expect,beforeEach,waitsFor,jasmine*/


define(
    ["../../src/services/DndService"],
    function (DndService) {
        "use strict";

        describe("The drag-and-drop service", function () {
            var service;

            beforeEach(function () {
                var mockLog = jasmine.createSpyObj("$log", ['debug']);
                service = new DndService(mockLog);
            });

            it("allows setting of arbitrary objects", function () {
                var foo = {
                    bar: function () { return 42; }
                };

                service.setData('xyz', foo);

                // Test that we can get back callable data, since this is
                // a key reason for having a service separate from HTML5 DnD.
                expect(service.getData('xyz').bar()).toEqual(42);
            });

            it("stores data under specified keys", function () {
                service.setData('abc', 42);
                service.setData('def', "some data");

                expect(service.getData('abc')).toEqual(42);
                expect(service.getData('def')).toEqual("some data");
            });

            it("removes data", function () {
                service.setData('abc', 42);
                service.removeData('abc');
                expect(service.getData('abc')).toBeUndefined();
            });

        });
    }
);