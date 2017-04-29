
define(
    ["../src/AutoflowTabularController"],
    function (AutoflowTabularController) {

        describe("The autoflow tabular controller", function () {
            var mockScope,
                mockTimeout,
                mockSubscriber,
                mockDomainObject,
                mockSubscription,
                controller;

            // Fire watches that are registered as functions.
            function fireFnWatches() {
                mockScope.$watch.calls.forEach(function (call) {
                    if (typeof call.args[0] === 'function') {
                        call.args[1](call.args[0]());
                    }
                });
            }

            beforeEach(function () {
                mockScope = jasmine.createSpyObj(
                    "$scope",
                    ["$on", "$watch"]
                );
                mockTimeout = jasmine.createSpy("$timeout");
                mockSubscriber = jasmine.createSpyObj(
                    "telemetrySubscriber",
                    ["subscribe"]
                );
                mockDomainObject = jasmine.createSpyObj(
                    "domainObject",
                    ["getId", "getModel", "getCapability"]
                );
                mockSubscription = jasmine.createSpyObj(
                    "subscription",
                    [
                        "unsubscribe",
                        "getTelemetryObjects",
                        "getDomainValue",
                        "getRangeValue"
                    ]
                );

                mockSubscriber.subscribe.andReturn(mockSubscription);
                mockDomainObject.getModel.andReturn({name: "something"});

                controller = new AutoflowTabularController(
                    mockScope,
                    mockTimeout,
                    mockSubscriber
                );
            });

            it("listens for the represented domain object", function () {
                expect(mockScope.$watch).toHaveBeenCalledWith(
                    "domainObject",
                    jasmine.any(Function)
                );
            });

            it("provides a getter-setter function for filtering", function () {
                expect(controller.filter()).toEqual("");
                controller.filter("something");
                expect(controller.filter()).toEqual("something");
            });

            it("tracks bounds and adjust number of rows accordingly", function () {
                // Rows are 15px high, and need room for an 10px slider
                controller.setBounds({ width: 700, height: 120 });
                expect(controller.getRows()).toEqual(6); // 110 usable height / 16px
                controller.setBounds({ width: 700, height: 240 });
                expect(controller.getRows()).toEqual(14); // 230 usable height / 16px
            });

            it("subscribes to a represented object's telemetry", function () {
                // Set up subscription, scope
                mockSubscription.getTelemetryObjects
                    .andReturn([mockDomainObject]);
                mockScope.domainObject = mockDomainObject;

                // Invoke the watcher with represented domain object
                mockScope.$watch.mostRecentCall.args[1](mockDomainObject);

                // Should have subscribed to it
                expect(mockSubscriber.subscribe).toHaveBeenCalledWith(
                    mockDomainObject,
                    jasmine.any(Function)
                );

                // Should report objects as reported from subscription
                expect(controller.getTelemetryObjects())
                    .toEqual([mockDomainObject]);
            });

            it("releases subscriptions on destroy", function () {
                // Set up subscription...
                mockSubscription.getTelemetryObjects
                    .andReturn([mockDomainObject]);
                mockScope.domainObject = mockDomainObject;
                mockScope.$watch.mostRecentCall.args[1](mockDomainObject);

                // Verify precondition
                expect(mockSubscription.unsubscribe).not.toHaveBeenCalled();

                // Make sure we're listening for $destroy
                expect(mockScope.$on).toHaveBeenCalledWith(
                    "$destroy",
                    jasmine.any(Function)
                );

                // Fire a destroy event
                mockScope.$on.mostRecentCall.args[1]();

                // Should have unsubscribed
                expect(mockSubscription.unsubscribe).toHaveBeenCalled();
            });

            it("presents latest values and latest update state", function () {
                // Make sure values are available
                mockSubscription.getDomainValue.andReturn(402654321123);
                mockSubscription.getRangeValue.andReturn(789);
                mockDomainObject.getId.andReturn('testId');

                // Set up subscription...
                mockSubscription.getTelemetryObjects
                    .andReturn([mockDomainObject]);
                mockScope.domainObject = mockDomainObject;
                mockScope.$watch.mostRecentCall.args[1](mockDomainObject);

                // Fire subscription callback
                mockSubscriber.subscribe.mostRecentCall.args[1]();

                // ...and exposed the results for template to consume
                expect(controller.updated()).toEqual("1982-278 08:25:21.123Z");
                expect(controller.rangeValues().testId).toEqual(789);
            });

            it("sorts domain objects by index", function () {
                var testIndexes = { a: 2, b: 1, c: 3, d: 0 },
                    mockDomainObjects = Object.keys(testIndexes).sort().map(function (id) {
                        var mockDomainObj = jasmine.createSpyObj(
                            "domainObject",
                            ["getId", "getModel"]
                        );

                        mockDomainObj.getId.andReturn(id);
                        mockDomainObj.getModel.andReturn({ index: testIndexes[id] });

                        return mockDomainObj;
                    });

                // Expose those domain objects...
                mockSubscription.getTelemetryObjects.andReturn(mockDomainObjects);
                mockScope.domainObject = mockDomainObject;
                mockScope.$watch.mostRecentCall.args[1](mockDomainObject);

                // Fire subscription callback
                mockSubscriber.subscribe.mostRecentCall.args[1]();

                // Controller should expose same objects, but sorted by index from model
                expect(controller.getTelemetryObjects()).toEqual([
                    mockDomainObjects[3], // d, index=0
                    mockDomainObjects[1], // b, index=1
                    mockDomainObjects[0], // a, index=2
                    mockDomainObjects[2]  // c, index=3
                ]);
            });

            it("uses a timeout to throttle update", function () {
                // Set up subscription...
                mockSubscription.getTelemetryObjects
                    .andReturn([mockDomainObject]);
                mockScope.domainObject = mockDomainObject;

                // Set the object in view; should not need a timeout
                mockScope.$watch.mostRecentCall.args[1](mockDomainObject);
                expect(mockTimeout.calls.length).toEqual(0);

                // Next call should schedule an update on a timeout
                mockScope.$watch.mostRecentCall.args[1](mockDomainObject);
                expect(mockTimeout.calls.length).toEqual(1);

                // ...but this last one should not, since existing
                // timeout will cover it
                mockScope.$watch.mostRecentCall.args[1](mockDomainObject);
                expect(mockTimeout.calls.length).toEqual(1);
            });

            it("allows changing column width", function () {
                var initialWidth = controller.columnWidth();
                controller.increaseColumnWidth();
                expect(controller.columnWidth()).toBeGreaterThan(initialWidth);
            });

            describe("filter", function () {
                var doFilter,
                    filteredObjects,
                    filteredObjectNames;

                beforeEach(function () {
                    var telemetryObjects,
                        updateFilteredObjects;

                    telemetryObjects = [
                        'DEF123',
                        'abc789',
                        '456abc',
                        '4ab3cdef',
                        'hjs[12].*(){}^\\'
                    ].map(function (objectName, index) {
                        var mockTelemetryObject = jasmine.createSpyObj(
                            objectName,
                            ["getId", "getModel"]
                        );

                        mockTelemetryObject.getId.andReturn(objectName);
                        mockTelemetryObject.getModel.andReturn({
                            name: objectName,
                            index: index
                        });

                        return mockTelemetryObject;
                    });

                    mockSubscription
                        .getTelemetryObjects
                        .andReturn(telemetryObjects);

                    // Trigger domainObject change to create subscription.
                    mockScope.$watch.mostRecentCall.args[1](mockDomainObject);

                    updateFilteredObjects = function () {
                        filteredObjects = controller.getTelemetryObjects();
                        filteredObjectNames = filteredObjects.map(function (o) {
                            return o.getModel().name;
                        });
                    };

                    doFilter = function (term) {
                        controller.filter(term);
                        // Filter is debounced so we have to force it to occur.
                        mockTimeout.mostRecentCall.args[0]();
                        updateFilteredObjects();
                    };

                    updateFilteredObjects();
                });

                it("initially shows all objects", function () {
                    expect(filteredObjectNames).toEqual([
                        'DEF123',
                        'abc789',
                        '456abc',
                        '4ab3cdef',
                        'hjs[12].*(){}^\\'
                    ]);
                });

                it("by blank string matches all objects", function () {
                    doFilter('');
                    expect(filteredObjectNames).toEqual([
                        'DEF123',
                        'abc789',
                        '456abc',
                        '4ab3cdef',
                        'hjs[12].*(){}^\\'
                    ]);
                });

                it("exactly matches an object name", function () {
                    doFilter('4ab3cdef');
                    expect(filteredObjectNames).toEqual(['4ab3cdef']);
                });

                it("partially matches object names", function () {
                    doFilter('abc');
                    expect(filteredObjectNames).toEqual([
                        'abc789',
                        '456abc'
                    ]);
                });

                it("matches case insensitive names", function () {
                    doFilter('def');
                    expect(filteredObjectNames).toEqual([
                        'DEF123',
                        '4ab3cdef'
                    ]);
                });

                it("works as expected with special characters", function () {
                    doFilter('[12]');
                    expect(filteredObjectNames).toEqual(['hjs[12].*(){}^\\']);
                    doFilter('.*');
                    expect(filteredObjectNames).toEqual(['hjs[12].*(){}^\\']);
                    doFilter('.*()');
                    expect(filteredObjectNames).toEqual(['hjs[12].*(){}^\\']);
                    doFilter('.*?');
                    expect(filteredObjectNames).toEqual([]);
                    doFilter('.+');
                    expect(filteredObjectNames).toEqual([]);
                });

                it("exposes CSS classes from limits", function () {
                    var id = mockDomainObject.getId(),
                        testClass = "some-css-class",
                        mockLimitCapability =
                            jasmine.createSpyObj('limit', ['evaluate']);

                    mockDomainObject.getCapability.andCallFake(function (key) {
                        return key === 'limit' && mockLimitCapability;
                    });
                    mockLimitCapability.evaluate
                        .andReturn({ cssClass: testClass });

                    mockSubscription.getTelemetryObjects
                        .andReturn([mockDomainObject]);

                    fireFnWatches();
                    mockSubscriber.subscribe.mostRecentCall.args[1]();

                    expect(controller.classes()[id]).toEqual(testClass);
                });

                it("exposes a counter that changes with each update", function () {
                    var i, prior;

                    for (i = 0; i < 10; i += 1) {
                        prior = controller.counter();
                        expect(controller.counter()).toEqual(prior);
                        mockSubscriber.subscribe.mostRecentCall.args[1]();
                        expect(controller.counter()).not.toEqual(prior);
                    }
                });
            });
        });
    }
);
