/*global define,describe,it,expect,beforeEach,waitsFor,jasmine,window,afterEach*/

define(
    ['../../src/controllers/TimelineGraphController'],
    function (TimelineGraphController) {
        'use strict';

        describe("The Timeline graph controller", function () {
            var mockScope,
                testResources,
                controller;

            beforeEach(function () {
                mockScope = jasmine.createSpyObj(
                    '$scope',
                    [ '$watchCollection' ]
                );
                testResources = [
                    { key: 'abc', name: "Some name" },
                    { key: 'def', name: "Test type", units: "Test units" },
                    { key: 'xyz', name: "Something else" }
                ];
                controller = new TimelineGraphController(
                    mockScope,
                    testResources
                );
            });

            it("watches for parameter changes", function () {
                expect(mockScope.$watchCollection).toHaveBeenCalledWith(
                    'parameters',
                    jasmine.any(Function)
                );
            });

            it("updates graphs when parameters change", function () {
                var mockGraphA = jasmine.createSpyObj('graph-a', ['setBounds']),
                    mockGraphB = jasmine.createSpyObj('graph-b', ['setBounds']);

                // Supply new parameters
                mockScope.$watchCollection.mostRecentCall.args[1]({
                    graphs: [ mockGraphA, mockGraphB ],
                    origin: 9,
                    duration: 144
                });

                // Graphs should have both been updated
                expect(mockGraphA.setBounds).toHaveBeenCalledWith(9, 144);
                expect(mockGraphB.setBounds).toHaveBeenCalledWith(9, 144);
            });

            it("provides labels for graphs", function () {
                var mockGraph = jasmine.createSpyObj('graph', ['minimum', 'maximum']);

                mockGraph.minimum.andReturn(12.3412121);
                mockGraph.maximum.andReturn(88.7555555);
                mockGraph.key = "def";

                expect(controller.label(mockGraph)).toEqual({
                    title: "Test type (Test units)",
                    low: "12.341",
                    middle: "50.548",
                    high: "88.756"
                });
            });
        });
    }
);
