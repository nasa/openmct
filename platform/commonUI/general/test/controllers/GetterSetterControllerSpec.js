/*global define,Promise,describe,it,expect,beforeEach,waitsFor,jasmine*/

define(
    ["../../src/controllers/GetterSetterController"],
    function (GetterSetterController) {
        "use strict";

        describe("The getter-setter controller", function () {
            var mockScope,
                mockModel,
                controller;

            beforeEach(function () {
                mockScope = jasmine.createSpyObj("$scope", ["$watch"]);
                mockModel = jasmine.createSpy("ngModel");
                mockScope.ngModel = mockModel;
                controller = new GetterSetterController(mockScope);
            });

            it("watches for changes to external and internal mode", function () {
                expect(mockScope.$watch).toHaveBeenCalledWith(
                    "ngModel()",
                    jasmine.any(Function)
                );
                expect(mockScope.$watch).toHaveBeenCalledWith(
                    "getterSetter.value",
                    jasmine.any(Function)
                );
            });

            it("updates an external function when changes are detected", function () {
                mockScope.getterSetter.value = "some new value";
                // Verify precondition
                expect(mockScope.ngModel)
                    .not.toHaveBeenCalledWith("some new value");
                // Fire the matching watcher
                mockScope.$watch.calls.forEach(function (call) {
                    if (call.args[0] === "getterSetter.value") {
                        call.args[1](mockScope.getterSetter.value);
                    }
                });
                // Verify getter-setter was notified
                expect(mockScope.ngModel)
                    .toHaveBeenCalledWith("some new value");
            });

            it("updates internal state when external changes are detected", function () {
                mockScope.ngModel.andReturn("some other new value");
                // Verify precondition
                expect(mockScope.getterSetter.value).toBeUndefined();
                // Fire the matching watcher
                mockScope.$watch.calls.forEach(function (call) {
                    if (call.args[0] === "ngModel()") {
                        call.args[1]("some other new value");
                    }
                });
                // Verify state in scope was updated
                expect(mockScope.getterSetter.value)
                    .toEqual("some other new value");
            });

        });
    }
);