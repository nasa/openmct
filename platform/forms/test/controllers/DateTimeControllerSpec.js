/*global define,describe,it,expect,beforeEach,waitsFor,jasmine*/

define(
    ["../../src/controllers/DateTimeController"],
    function (DateTimeController) {
        "use strict";

        describe("The date-time directive", function () {
            var mockScope,
                controller;

            beforeEach(function () {
                mockScope = jasmine.createSpyObj("$scope", [ "$watch" ]);
                controller = new DateTimeController(mockScope);
            });

            it("watches for changes in fields", function () {
                ["date", "hour", "min", "sec"].forEach(function (fieldName) {
                    expect(mockScope.$watch).toHaveBeenCalledWith(
                        "datetime." + fieldName,
                        jasmine.any(Function)
                    );
                });
            });

            it("converts date-time input into a timestamp", function () {
                mockScope.ngModel = {};
                mockScope.field = "test";
                mockScope.datetime.date = "2014-332";
                mockScope.datetime.hour = 22;
                mockScope.datetime.min = 55;
                mockScope.datetime.sec = 13;

                mockScope.$watch.mostRecentCall.args[1]();

                expect(mockScope.ngModel.test).toEqual(1417215313000);
            });

        });
    }
);