/*global define,describe,it,expect,beforeEach,waitsFor,jasmine,window,afterEach*/

define(
    ['../../src/capabilities/CumulativeGraph'],
    function (CumulativeGraph) {
        'use strict';

        describe("A cumulative resource graph", function () {
            var mockGraph,
                points,
                graph;

            beforeEach(function () {
                points = [ 0, 10, -10, -100, 20, 100, 0 ];

                mockGraph = jasmine.createSpyObj(
                    'graph',
                    [ 'getPointCount', 'getDomainValue', 'getRangeValue' ]
                );

                mockGraph.getPointCount.andReturn(points.length * 2);
                mockGraph.getDomainValue.andCallFake(function (i) {
                    return Math.floor(i / 2) * 100 + 25;
                });
                mockGraph.getRangeValue.andCallFake(function (i) {
                    return points[Math.floor(i / 2) + i % 2];
                });

                graph = new CumulativeGraph(
                    mockGraph,
                    1000,
                    2000,
                    1500,
                    1 / 10
                );
            });

            it("accumulates its wrapped instantaneous graph", function () {
                // Note that range values are percentages
                expect(graph.getDomainValue(0)).toEqual(0);
                expect(graph.getRangeValue(0)).toEqual(50); // initial state
                expect(graph.getDomainValue(1)).toEqual(25);
                expect(graph.getRangeValue(1)).toEqual(50); // initial state
                expect(graph.getDomainValue(2)).toEqual(125);
                expect(graph.getRangeValue(2)).toEqual(60); // +10
                expect(graph.getDomainValue(3)).toEqual(225);
                expect(graph.getRangeValue(3)).toEqual(50); // -10
                expect(graph.getDomainValue(4)).toEqual(275);
                expect(graph.getRangeValue(4)).toEqual(0); // -100 (hit bottom)
                expect(graph.getDomainValue(5)).toEqual(325);
                expect(graph.getRangeValue(5)).toEqual(0); // still at 0...
                expect(graph.getDomainValue(6)).toEqual(425);
                expect(graph.getRangeValue(6)).toEqual(20); // +20
                expect(graph.getDomainValue(7)).toEqual(505);
                expect(graph.getRangeValue(7)).toEqual(100); // +100
                expect(graph.getDomainValue(8)).toEqual(525);
                expect(graph.getRangeValue(8)).toEqual(100); // still full
                expect(graph.getDomainValue(9)).toEqual(625);
                expect(graph.getRangeValue(9)).toEqual(100); // still full
                expect(graph.getPointCount()).toEqual(10);
            });



        });
    }
);