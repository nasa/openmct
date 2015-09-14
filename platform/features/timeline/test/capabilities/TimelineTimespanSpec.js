/*global define,describe,it,expect,beforeEach,waitsFor,jasmine,window,afterEach*/

define(
    ['../../src/capabilities/TimelineTimespan'],
    function (TimelineTimespan) {
        'use strict';

        describe("A Timeline's timespan", function () {
            var testModel,
                mockTimespans,
                mockMutation,
                mutationModel,
                timespan;

            function makeMockTimespan(end) {
                var mockTimespan = jasmine.createSpyObj(
                    'timespan-' + end,
                    ['getEnd']
                );
                mockTimespan.getEnd.andReturn(end);
                return mockTimespan;
            }

            beforeEach(function () {
                testModel = {
                    start: {
                        timestamp: 42000,
                        epoch: "TEST"
                    }
                };

                mutationModel = JSON.parse(JSON.stringify(testModel));

                mockMutation = jasmine.createSpyObj("mutation", ["mutate"]);
                mockTimespans = [ 44000, 65000, 1100 ].map(makeMockTimespan);

                mockMutation.mutate.andCallFake(function (mutator) {
                    mutator(mutationModel);
                });

                timespan = new TimelineTimespan(
                    testModel,
                    mockMutation,
                    mockTimespans
                );
            });

            it("provides a start time", function () {
                expect(timespan.getStart()).toEqual(42000);
            });

            it("provides an end time", function () {
                expect(timespan.getEnd()).toEqual(65000);
            });

            it("provides duration", function () {
                expect(timespan.getDuration()).toEqual(65000 - 42000);
            });

            it("provides an epoch", function () {
                expect(timespan.getEpoch()).toEqual("TEST");
            });


            it("sets start time using mutation capability", function () {
                timespan.setStart(52000);
                expect(mutationModel.start.timestamp).toEqual(52000);
                // Original model should still be the same
                expect(testModel.start.timestamp).toEqual(42000);
            });

            it("makes no changes with setEnd", function () {
                // Copy initial state to verify that it doesn't change
                var initialModel = JSON.parse(JSON.stringify(testModel));
                timespan.setEnd(123454321);
                // Neither model should have changed
                expect(testModel).toEqual(initialModel);
                expect(mutationModel).toEqual(initialModel);
            });

            it("makes no changes with setDuration", function () {
                // Copy initial state to verify that it doesn't change
                var initialModel = JSON.parse(JSON.stringify(testModel));
                timespan.setDuration(123454321);
                // Neither model should have changed
                expect(testModel).toEqual(initialModel);
                expect(mutationModel).toEqual(initialModel);
            });
        });
    }
);