
/*global define,describe,it,expect,beforeEach,waitsFor,jasmine,window,afterEach*/

define(
    ["../../src/controllers/TimelineDateTimeController"],
    function (TimelineDateTimeController) {
        "use strict";

        describe("The date-time controller for timeline creation", function () {
            var mockScope,
                controller;

            beforeEach(function () {
                mockScope = jasmine.createSpyObj('$scope', ['$watchCollection']);
                mockScope.field = 'testField';
                mockScope.ngModel = { testField: { timestamp: 0, epoch: "SET" } };
                controller = new TimelineDateTimeController(mockScope);
            });


            // Verify two-way binding support
            it("updates model on changes to entry fields", function () {
                // Make sure we're looking at the right watch
                expect(mockScope.$watchCollection.calls[0].args[0])
                    .toEqual("datetime");
                mockScope.$watchCollection.calls[0].args[1]({
                    days: 4,
                    hours: 12,
                    minutes: 30,
                    seconds: 11
                });
                expect(mockScope.ngModel.testField.timestamp).toEqual(
                    ((((((4 * 24) + 12) * 60) + 30) * 60) + 11) * 1000
                );
            });

            it("updates form when model changes", function () {
                // Make sure we're looking at the right watch
                expect(mockScope.$watchCollection.calls[1].args[0])
                    .toEqual(jasmine.any(Function));
                // ...and that it's really looking at the field in ngModel
                expect(mockScope.$watchCollection.calls[1].args[0]())
                    .toBe(mockScope.ngModel.testField);
                mockScope.$watchCollection.calls[1].args[1]({
                    timestamp: ((((((4 * 24) + 12) * 60) + 30) * 60) + 11) * 1000
                });
                expect(mockScope.datetime).toEqual({
                    days: 4,
                    hours: 12,
                    minutes: 30,
                    seconds: 11
                });
            });

        });
    }
);
