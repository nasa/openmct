/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2018, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT is licensed under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 *
 * Open MCT includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/

define(
    [
        "../src/FixedController",
        "zepto"
    ],
    function (
        FixedController,
        $
    ) {

        describe("The Fixed Position controller", function () {
            var mockScope,
                mockQ,
                mockDialogService,
                mockHandler,
                mockFormatter,
                mockDomainObject,
                mockHandle,
                mockEvent,
                testGrid,
                testModel,
                testValues,
                testConfiguration,
                mockOpenMCT,
                mockTelemetryAPI,
                mockCompositionAPI,
                mockCompositionCollection,
                mockChildren,
                mockConductor,
                mockMetadata,
                mockTimeSystem,
                mockLimitEvaluator,
                mockSelection,
                $element = [],
                selectable = [],
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

            // As above, but for $on calls
            function findOn(expr) {
                var on;
                mockScope.$on.calls.forEach(function (call) {
                    if (call.args[0] === expr) {
                        on = call.args[1];
                    }
                });
                return on;
            }

            function makeMockDomainObject(id) {
                return {
                    identifier: {
                        key: "domainObject-" + id
                    },
                    name: "Point " + id
                };
            }

            beforeEach(function () {
                mockScope = jasmine.createSpyObj(
                    '$scope',
                    ["$on", "$watch", "$digest", "commit"]
                );
                mockHandler = jasmine.createSpyObj(
                    'telemetryHandler',
                    ['handle']
                );
                mockQ = jasmine.createSpyObj('$q', ['when']);
                mockDialogService = jasmine.createSpyObj(
                    'dialogService',
                    ['getUserInput']
                );
                mockFormatter = jasmine.createSpyObj(
                    'telemetryFormatter',
                    ['format']
                );
                mockFormatter.format.andCallFake(function (valueMetadata) {
                    return "Formatted " + valueMetadata.value;
                });

                mockDomainObject = jasmine.createSpyObj(
                    'domainObject',
                    ['getId', 'getModel', 'getCapability', 'useCapability']
                );

                mockHandle = jasmine.createSpyObj(
                    'subscription',
                    [
                        'unsubscribe',
                        'getDomainValue',
                        'getTelemetryObjects',
                        'getRangeValue',
                        'getDatum',
                        'request'
                    ]
                );
                mockConductor = jasmine.createSpyObj('conductor', [
                    'on',
                    'off',
                    'bounds',
                    'timeSystem',
                    'clock'
                ]);
                mockConductor.bounds.andReturn({});
                mockTimeSystem = {
                    metadata: {
                        key: 'key'
                    }
                };
                mockConductor.timeSystem.andReturn(mockTimeSystem);

                mockEvent = jasmine.createSpyObj(
                    'event',
                    ['preventDefault']
                );

                mockTelemetryAPI = jasmine.createSpyObj('telemetry',
                    [
                        'subscribe',
                        'request',
                        'isTelemetryObject',
                        'getMetadata',
                        'limitEvaluator',
                        'getValueFormatter'
                    ]
                );
                mockTelemetryAPI.isTelemetryObject.andReturn(true);
                mockTelemetryAPI.request.andReturn(Promise.resolve([]));

                testGrid = [123, 456];
                testModel = {
                    composition: ['a', 'b', 'c'],
                    layoutGrid: testGrid
                };
                testValues = { a: 10, b: 42, c: 31.42 };
                testConfiguration = { elements: [
                    { type: "fixed.telemetry", id: 'a', x: 1, y: 1, useGrid: true},
                    { type: "fixed.telemetry", id: 'b', x: 1, y: 1, useGrid: true},
                    { type: "fixed.telemetry", id: 'c', x: 1, y: 1, useGrid: true}
                ]};

                mockChildren = testModel.composition.map(makeMockDomainObject);
                mockCompositionCollection = jasmine.createSpyObj('compositionCollection',
                    [
                        'load'
                    ]
                );
                mockCompositionAPI = jasmine.createSpyObj('composition',
                    [
                        'get'
                    ]
                );
                mockCompositionAPI.get.andReturn(mockCompositionCollection);
                mockCompositionCollection.load.andReturn(
                    Promise.resolve(mockChildren)
                );

                mockScope.model = testModel;
                mockScope.configuration = testConfiguration;

                selectable[0] = {
                    context: {
                        oldItem: mockDomainObject
                    }
                };
                mockSelection = jasmine.createSpyObj("selection", [
                    'select',
                    'on',
                    'off',
                    'get'
                ]);
                mockSelection.get.andReturn([]);

                mockOpenMCT = {
                    time: mockConductor,
                    telemetry: mockTelemetryAPI,
                    composition: mockCompositionAPI,
                    selection: mockSelection
                };

                $element = $('<div></div>');
                spyOn($element[0], 'click');

                mockMetadata = jasmine.createSpyObj('mockMetadata', [
                    'valuesForHints',
                    'value',
                    'values'
                ]);
                mockMetadata.value.andReturn({
                    key: 'value'
                });

                mockMetadata.valuesForHints.andCallFake(function (hints) {
                    if (hints === ['domain']) {
                        return [{
                            key: 'time'
                        }];
                    } else {
                        return [{
                            key: 'value'
                        }];
                    }
                });

                mockLimitEvaluator = jasmine.createSpyObj('limitEvaluator', [
                    'evaluate'
                ]);

                mockLimitEvaluator.evaluate.andReturn({});

                mockTelemetryAPI.getMetadata.andReturn(mockMetadata);
                mockTelemetryAPI.limitEvaluator.andReturn(mockLimitEvaluator);
                mockTelemetryAPI.getValueFormatter.andReturn(mockFormatter);

                controller = new FixedController(
                    mockScope,
                    mockQ,
                    mockDialogService,
                    mockOpenMCT,
                    $element
                );

                findWatch("model.layoutGrid")(testModel.layoutGrid);
            });

            it("subscribes when a domain object is available", function () {
                var dunzo = false;

                mockScope.domainObject = mockDomainObject;
                findWatch("domainObject")(mockDomainObject).then(function () {
                    dunzo = true;
                });

                waitsFor(function () {
                    return dunzo;
                }, "Telemetry fetched", 200);

                runs(function () {
                    mockChildren.forEach(function (child) {
                        expect(mockTelemetryAPI.subscribe).toHaveBeenCalledWith(
                            child,
                            jasmine.any(Function),
                            jasmine.any(Object)
                        );
                    });
                });
            });

            it("releases subscriptions when domain objects change", function () {
                var dunzo = false;
                var unsubscribe = jasmine.createSpy('unsubscribe');

                mockTelemetryAPI.subscribe.andReturn(unsubscribe);

                mockScope.domainObject = mockDomainObject;
                findWatch("domainObject")(mockDomainObject).then(function () {
                    dunzo = true;
                });

                waitsFor(function () {
                    return dunzo;
                }, "Telemetry fetched", 200);

                runs(function () {
                    expect(unsubscribe).not.toHaveBeenCalled();

                    dunzo = false;

                    findWatch("domainObject")(mockDomainObject).then(function () {
                        dunzo = true;
                    });

                    waitsFor(function () {
                        return dunzo;
                    }, "Telemetry fetched", 200);

                    runs(function () {
                        expect(unsubscribe.calls.length).toBe(mockChildren.length);
                    });

                });
            });

            it("exposes visible elements based on configuration", function () {
                var elements;

                mockScope.model = testModel;
                testModel.modified = 1;
                findWatch("model.modified")(testModel.modified);

                elements = controller.getElements();
                expect(elements.length).toEqual(3);
                expect(elements[0].id).toEqual('a');
                expect(elements[1].id).toEqual('b');
                expect(elements[2].id).toEqual('c');
            });

            it("allows elements to be selected", function () {
                testModel.modified = 1;
                findWatch("model.modified")(testModel.modified);

                selectable[0].context.elementProxy = controller.getElements()[1];
                mockOpenMCT.selection.on.mostRecentCall.args[1](selectable);

                expect(controller.isElementSelected()).toBe(true);
            });

            it("allows selection retrieval", function () {
                var elements;

                testModel.modified = 1;
                findWatch("model.modified")(testModel.modified);

                elements = controller.getElements();
                selectable[0].context.elementProxy = elements[1];
                mockOpenMCT.selection.on.mostRecentCall.args[1](selectable);

                expect(controller.getSelectedElement()).toEqual(elements[1]);
            });

            it("selects the parent view when selected element is removed", function () {
                testModel.modified = 1;
                findWatch("model.modified")(testModel.modified);

                var elements = controller.getElements();
                selectable[0].context.elementProxy = elements[1];
                mockOpenMCT.selection.on.mostRecentCall.args[1](selectable);

                elements[1].remove();
                testModel.modified = 2;
                findWatch("model.modified")(testModel.modified);

                expect($element[0].click).toHaveBeenCalled();
            });

            it("retains selections during refresh", function () {
                // Get elements; remove one of them; trigger refresh.
                // Same element (at least by index) should still be selected.
                var elements;

                testModel.modified = 1;
                findWatch("model.modified")(testModel.modified);

                elements = controller.getElements();
                selectable[0].context.elementProxy = elements[1];
                mockOpenMCT.selection.on.mostRecentCall.args[1](selectable);

                expect(controller.getSelectedElement()).toEqual(elements[1]);

                elements[2].remove();
                testModel.modified = 2;
                findWatch("model.modified")(testModel.modified);

                elements = controller.getElements();

                // Verify removal, as test assumes this
                expect(elements.length).toEqual(2);

                expect(controller.shouldSelect(elements[1])).toBe(true);
            });

            it("Displays received values for telemetry elements", function () {
                var elements;
                var mockTelemetry = {
                    time: 100,
                    value: 200
                };
                var testElement = {};
                var telemetryObject = {
                    identifier: {
                        key: '12345'
                    }
                };
                mockConductor.clock.andReturn({});
                controller.elementProxiesById = {};
                controller.elementProxiesById['12345'] = [testElement];
                controller.elementProxies = [testElement];

                controller.subscribeToObjects([telemetryObject]);
                mockTelemetryAPI.subscribe.mostRecentCall.args[1](mockTelemetry);

                waitsFor(function () {
                    return controller.digesting === false;
                }, "digest to complete", 100);

                runs(function () {
                    // Get elements that controller is now exposing
                    elements = controller.getElements();

                    // Formatted values should be available
                    expect(elements[0].value).toEqual("Formatted 200");
                });

            });

            it("updates elements styles when grid size changes", function () {
                var originalLeft;

                mockScope.domainObject = mockDomainObject;
                mockScope.model = testModel;
                findWatch("domainObject")(mockDomainObject);
                findWatch("model.modified")(1);
                findWatch("model.composition")(mockScope.model.composition);
                findWatch("model.layoutGrid")([10, 10]);
                originalLeft = controller.getElements()[0].style.left;
                findWatch("model.layoutGrid")([20, 20]);
                expect(controller.getElements()[0].style.left)
                    .not.toEqual(originalLeft);
            });

            it("listens for drop events", function () {
                mockScope.domainObject = mockDomainObject;
                mockScope.model = testModel;

                // Layout should position panels according to
                // where the user dropped them, so it needs to
                // listen for drop events.
                expect(mockScope.$on).toHaveBeenCalledWith(
                    'mctDrop',
                    jasmine.any(Function)
                );

                // Verify precondition
                expect(testConfiguration.elements.length).toEqual(3);

                // Notify that a drop occurred
                testModel.composition.push('d');
                findOn('mctDrop')(
                    mockEvent,
                    'd',
                    { x: 300, y: 100 }
                );

                // Should have added an element
                expect(testConfiguration.elements.length).toEqual(4);

                // ...and prevented default...
                expect(mockEvent.preventDefault).toHaveBeenCalled();

                // Should have triggered commit (provided by
                // EditRepresenter) with some message.
                expect(mockScope.commit)
                    .toHaveBeenCalledWith(jasmine.any(String));
            });

            it("ignores drops when default has been prevented", function () {
                // Avoids redundant drop-handling, WTD-1233
                mockEvent.defaultPrevented = true;

                // Notify that a drop occurred
                testModel.composition.push('d');
                findOn('mctDrop')(
                    mockEvent,
                    'd',
                    { x: 300, y: 100 }
                );

                // Should NOT have added an element
                expect(testConfiguration.elements.length).toEqual(3);
            });

            it("unsubscribes when destroyed", function () {

                var dunzo = false;
                var unsubscribe = jasmine.createSpy('unsubscribe');

                mockTelemetryAPI.subscribe.andReturn(unsubscribe);

                mockScope.domainObject = mockDomainObject;
                findWatch("domainObject")(mockDomainObject).then(function () {
                    dunzo = true;
                });

                waitsFor(function () {
                    return dunzo;
                }, "Telemetry fetched", 200);

                runs(function () {
                    expect(unsubscribe).not.toHaveBeenCalled();
                    // Destroy the scope
                    findOn('$destroy')();

                    //Check that the same unsubscribe function returned by the
                    expect(unsubscribe.calls.length).toBe(mockChildren.length);
                });
            });

            it("exposes its grid size", function () {
                findWatch('model.layoutGrid')(testGrid);
                // Template needs to be able to pass this into line
                // elements to size SVGs appropriately
                expect(controller.getGridSize()).toEqual(testGrid);
            });

            it("exposes a view-level selection proxy", function () {
                mockOpenMCT.selection.on.mostRecentCall.args[1](selectable);
                var selection = mockOpenMCT.selection.select.mostRecentCall.args[0];

                expect(mockOpenMCT.selection.select).toHaveBeenCalled();
                expect(selection.context.viewProxy).toBeDefined();
            });

            it("exposes drag handles", function () {
                var handles;

                testModel.modified = 1;
                findWatch("model.modified")(testModel.modified);

                selectable[0].context.elementProxy = controller.getElements()[1];
                mockOpenMCT.selection.on.mostRecentCall.args[1](selectable);

                // Should have a non-empty array of handles
                handles = controller.handles();

                expect(handles).toEqual(jasmine.any(Array));
                expect(handles.length).not.toEqual(0);

                // And they should have start/continue/end drag methods
                handles.forEach(function (handle) {
                    expect(handle.startDrag).toEqual(jasmine.any(Function));
                    expect(handle.continueDrag).toEqual(jasmine.any(Function));
                    expect(handle.endDrag).toEqual(jasmine.any(Function));
                });
            });

            it("exposes a move handle", function () {
                testModel.modified = 1;
                findWatch("model.modified")(testModel.modified);

                selectable[0].context.elementProxy = controller.getElements()[1];
                mockOpenMCT.selection.on.mostRecentCall.args[1](selectable);

                // Should have a move handle
                var handle = controller.moveHandle();

                // And it should have start/continue/end drag methods
                expect(handle.startDrag).toEqual(jasmine.any(Function));
                expect(handle.continueDrag).toEqual(jasmine.any(Function));
                expect(handle.endDrag).toEqual(jasmine.any(Function));
            });

            it("updates selection style during drag", function () {
                var oldStyle;

                testModel.modified = 1;
                findWatch("model.modified")(testModel.modified);

                selectable[0].context.elementProxy = controller.getElements()[1];
                mockOpenMCT.selection.on.mostRecentCall.args[1](selectable);

                // Get style
                oldStyle = controller.getSelectedElementStyle();

                // Start a drag gesture
                controller.moveHandle().startDrag();

                // Haven't moved yet; style shouldn't have updated yet
                expect(controller.getSelectedElementStyle()).toEqual(oldStyle);

                // Drag a little
                controller.moveHandle().continueDrag([1000, 100]);

                // Style should have been updated
                expect(controller.getSelectedElementStyle()).not.toEqual(oldStyle);
            });

            it("cleans up selection on scope destroy", function () {
                expect(mockScope.$on).toHaveBeenCalledWith(
                    '$destroy',
                    jasmine.any(Function)
                );

                mockScope.$on.mostRecentCall.args[1]();

                expect(mockOpenMCT.selection.off).toHaveBeenCalledWith(
                    'change',
                    jasmine.any(Function)
                );
            });

            describe("on display bounds changes", function () {
                var testBounds;
                var boundsChangeCallback;
                var objectOne;
                var objectTwo;

                beforeEach(function () {
                    testBounds = { start: 123, end: 321 };
                    boundsChangeCallback = mockConductor.on.mostRecentCall.args[1];
                    objectOne = {};
                    objectTwo = {};
                    controller.telemetryObjects = [
                        objectOne,
                        objectTwo
                    ];
                    spyOn(controller, "fetchHistoricalData");
                    controller.fetchHistoricalData.andCallThrough();
                });

                it("registers a bounds change listener", function () {
                    expect(mockConductor.on).toHaveBeenCalledWith("bounds", jasmine.any(Function));
                });

                it("requests only a single point", function () {
                    mockConductor.clock.andReturn(undefined);
                    boundsChangeCallback(testBounds);
                    expect(mockTelemetryAPI.request.calls.length).toBe(2);

                    mockTelemetryAPI.request.calls.forEach(function (call) {
                        expect(call.args[1].size).toBe(1);
                    });
                });

                it("Does not fetch historical data on tick", function () {
                    boundsChangeCallback(testBounds, true);
                    expect(mockTelemetryAPI.request.calls.length).toBe(0);
                });
            });

            describe("on receipt of telemetry", function () {
                var mockTelemetryObject;
                var testValue;
                var testElement;

                beforeEach(function () {
                    mockTelemetryObject = {
                        identifier: {
                            key: '12345'
                        }
                    };
                    testValue = 30;
                    testElement = {};

                    controller.elementProxiesById = {};
                    controller.elementProxiesById['12345'] = [testElement];
                    controller.elementProxies = [testElement];
                });

                it("updates displayed values from historical telemetry", function () {
                    spyOn(controller, "updateView");
                    controller.updateView.andCallThrough();

                    mockTelemetryAPI.request.andReturn(Promise.resolve([{
                        time: 100,
                        value: testValue
                    }]));

                    controller.fetchHistoricalData([mockTelemetryObject]);

                    waitsFor(function () {
                        return controller.digesting === false;
                    });

                    runs(function () {
                        expect(controller.updateView).toHaveBeenCalled();
                        expect(controller.getElements()[0].value)
                            .toEqual("Formatted " + testValue);
                    });
                });

                it("selects an range value to display, if available", function () {
                    mockMetadata.valuesForHints.andReturn([
                        {
                            key: 'range',
                            source: 'range'
                        }
                    ]);
                    var key = controller.chooseValueMetadataToDisplay(mockMetadata).source;
                    expect(key).toEqual('range');
                });

                it("selects the first non-domain value to display, if no range available", function () {
                    mockMetadata.valuesForHints.andReturn([]);
                    mockMetadata.values.andReturn([
                        {
                            key: 'domain',
                            source: 'domain',
                            hints: {
                                domain: 1
                            }
                        },
                        {
                            key: 'image',
                            source: 'image',
                            hints: {
                                image: 1
                            }
                        }
                    ]);
                    var key = controller.chooseValueMetadataToDisplay(mockMetadata).source;
                    expect(key).toEqual('image');
                });

                it("reflects limit status", function () {
                    mockLimitEvaluator.evaluate.andReturn({cssClass: "alarm-a"});
                    controller.updateView(mockTelemetryObject, [{
                        time: 100,
                        value: testValue
                    }]);

                    waitsFor(function () {
                        return controller.digesting === false;
                    });

                    runs(function () {
                        // Limit-based CSS classes should be available
                        expect(controller.getElements()[0].cssClass).toEqual("alarm-a");
                    });
                });

                it("listens for selection change events", function () {
                    expect(mockOpenMCT.selection.on).toHaveBeenCalledWith(
                        'change',
                        jasmine.any(Function)
                    );
                });

            });
        });
    }
);
