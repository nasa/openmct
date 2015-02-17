/*global define,describe,it,expect,beforeEach,jasmine*/

define(
    ["../src/FixedController"],
    function (FixedController) {
        "use strict";

        describe("The Fixed Position controller", function () {
            var mockScope,
                mockSubscriber,
                mockFormatter,
                mockDomainObject,
                mockSubscription,
                testGrid,
                testModel,
                testValues,
                controller;

            // Utility function; find a watch for a given expression
            function findWatch(expr) {
                var watch;
                mockScope.$watch.calls.forEach(function (call) {
                    if (call.args[0] === expr) {
                        watch = call.args[1];
                    }
                });
                return watch;
            }

            function makeMockDomainObject(id) {
                var mockObject = jasmine.createSpyObj(
                    'domainObject-' + id,
                    [ 'getId' ]
                );
                mockObject.getId.andReturn(id);
                return mockObject;
            }

            beforeEach(function () {
                mockScope = jasmine.createSpyObj(
                    '$scope',
                    [ "$on", "$watch" ]
                );
                mockSubscriber = jasmine.createSpyObj(
                    'telemetrySubscriber',
                    [ 'subscribe' ]
                );
                mockFormatter = jasmine.createSpyObj(
                    'telemetryFormatter',
                    [ 'formatDomainValue', 'formatRangeValue' ]
                );
                mockDomainObject = jasmine.createSpyObj(
                    'domainObject',
                    [ 'getId', 'getModel', 'getCapability' ]
                );
                mockSubscription = jasmine.createSpyObj(
                    'subscription',
                    [ 'unsubscribe', 'getTelemetryObjects', 'getRangeValue' ]
                );

                testGrid = [ 123, 456 ];
                testModel = {
                    composition: ['a', 'b', 'c'],
                    layoutGrid: testGrid
                };
                testValues = { a: 10, b: 42, c: 31.42 };

                mockSubscriber.subscribe.andReturn(mockSubscription);
                mockSubscription.getTelemetryObjects.andReturn(
                    testModel.composition.map(makeMockDomainObject)
                );
                mockSubscription.getRangeValue.andCallFake(function (o) {
                    return testValues[o.getId()];
                });
                mockFormatter.formatRangeValue.andCallFake(function (v) {
                    return "Formatted " + v;
                });

                controller = new FixedController(
                    mockScope,
                    mockSubscriber,
                    mockFormatter
                );
            });

            it("provides styles for cells", function () {
                expect(controller.getCellStyles())
                    .toEqual(jasmine.any(Array));
            });

            it("subscribes when a domain object is available", function () {
                mockScope.domainObject = mockDomainObject;
                findWatch("domainObject")(mockDomainObject);
                expect(mockSubscriber.subscribe).toHaveBeenCalledWith(
                    mockDomainObject,
                    jasmine.any(Function)
                );
            });

            it("releases subscriptions when domain objects change", function () {
                mockScope.domainObject = mockDomainObject;

                // First pass - should simply should subscribe
                findWatch("domainObject")(mockDomainObject);
                expect(mockSubscription.unsubscribe).not.toHaveBeenCalled();
                expect(mockSubscriber.subscribe.calls.length).toEqual(1);

                // Object changes - should unsubscribe then resubscribe
                findWatch("domainObject")(mockDomainObject);
                expect(mockSubscription.unsubscribe).toHaveBeenCalled();
                expect(mockSubscriber.subscribe.calls.length).toEqual(2);
            });

            it("configures view based on model", function () {
                mockScope.model = testModel;
                findWatch("model.composition")(mockScope.model.composition);
                // Should have styles for all elements of composition
                expect(controller.getStyle('a')).toBeDefined();
                expect(controller.getStyle('b')).toBeDefined();
                expect(controller.getStyle('c')).toBeDefined();
                expect(controller.getStyle('d')).not.toBeDefined();
            });

            it("provides values for telemetry elements", function () {
                // Initialize
                mockScope.domainObject = mockDomainObject;
                mockScope.model = testModel;
                findWatch("domainObject")(mockDomainObject);
                findWatch("model.composition")(mockScope.model.composition);

                // Invoke the subscription callback
                mockSubscriber.subscribe.mostRecentCall.args[1]();

                // Formatted values should be available
                expect(controller.getValue('a')).toEqual("Formatted 10");
                expect(controller.getValue('b')).toEqual("Formatted 42");
                expect(controller.getValue('c')).toEqual("Formatted 31.42");
            });

            it("adds grid cells to fill boundaries", function () {
                var s1 = {
                        width: testGrid[0] * 8,
                        height: testGrid[1] * 4
                    },
                    s2 = {
                        width: testGrid[0] * 10,
                        height: testGrid[1] * 6
                    };

                mockScope.model = testModel;
                findWatch("model.composition")(mockScope.model.composition);

                // Set first bounds
                controller.setBounds(s1);
                expect(controller.getCellStyles().length).toEqual(32); // 8 * 4
                // Set new bounds
                controller.setBounds(s2);
                expect(controller.getCellStyles().length).toEqual(60); // 10 * 6
            });
        });
    }
);