define(['../src/ConditionManager'], function (ConditionManager) {
    describe('A Summary Widget Condition Manager', function () {
        var conditionManager,
            mockDomainObject,
            mockCompObject1,
            mockCompObject2,
            mockCompObject3,
            mockMetadata,
            mockTelemetryCallbacks,
            mockEventCallbacks,
            unsubscribeSpies,
            unregisterSpies,
            mockMetadataManagers,
            mockComposition,
            mockOpenMCT,
            mockTelemetryAPI,
            addCallbackSpy,
            loadCallbackSpy,
            removeCallbackSpy,
            telemetryCallbackSpy,
            metadataCallbackSpy,
            mockTelemetryValues,
            mockTelemetryValues2,
            mockConditionEvaluator;

        beforeEach(function () {
            mockDomainObject = {
                identifier: {
                    key: 'testKey'
                },
                name: 'Test Object',
                composition: [{
                    mockCompObject1: {
                        key: 'mockCompObject1'
                    },
                    mockCompObject2 : {
                        key: 'mockCompObject2'
                    }
                }],
                configuration: {}
            };
            mockCompObject1 = {
                identifier: {
                    key: 'mockCompObject1'
                },
                name: 'Object 1'
            };
            mockCompObject2 = {
                identifier: {
                    key: 'mockCompObject2'
                },
                name: 'Object 2'
            };
            mockCompObject3 = {
                identifier: {
                    key: 'mockCompObject3'
                },
                name: 'Object 3'
            };
            mockMetadata = {
                mockCompObject1: {
                    property1: {
                        key: 'property1',
                        name: 'Property 1'
                    },
                    property2: {
                        key: 'property2',
                        name: 'Property 2'
                    }
                },
                mockCompObject2: {
                    property3: {
                        key: 'property3',
                        name: 'Property 3'
                    },
                    property4: {
                        key: 'property4',
                        name: 'Property 4'
                    }
                },
                mockCompObject3: {
                    property1: {
                        key: 'property1',
                        name: 'Property 1'
                    },
                    property2: {
                        key: 'property2',
                        name: 'Property 2'
                    }
                }
            };
            mockTelemetryCallbacks = {};
            mockEventCallbacks = {};
            unsubscribeSpies = jasmine.createSpyObj('mockUnsubscribeFunction', [
                'mockCompObject1',
                'mockCompObject2',
                'mockCompObject3'
            ]);
            unregisterSpies = jasmine.createSpyObj('mockUnregisterFunctions', [
                'load',
                'remove',
                'add'
            ]);
            mockTelemetryValues = {
                mockCompObject1: {
                    property1: 'Its a string',
                    property2: 42
                },
                mockCompObject2: {
                    property3: 'Execute order:',
                    property4: 66
                },
                mockCompObject3: {
                    property1: 'Testing 1 2 3',
                    property2: 9000
                }
            };
            mockTelemetryValues2 = {
                mockCompObject1: {
                    property1: 'Its a different string',
                    property2: 44
                },
                mockCompObject2: {
                    property3: 'Execute catch:',
                    property4: 22
                },
                mockCompObject3: {
                    property1: 'Walrus',
                    property2: 22
                }
            };
            mockMetadataManagers = {
                mockCompObject1: {
                    values: jasmine.createSpy('metadataManager').andReturn(
                        Object.values(mockMetadata.mockCompObject1)
                    )
                },
                mockCompObject2: {
                    values: jasmine.createSpy('metadataManager').andReturn(
                        Object.values(mockMetadata.mockCompObject2)
                    )
                },
                mockCompObject3: {
                    values: jasmine.createSpy('metadataManager').andReturn(
                        Object.values(mockMetadata.mockCompObject2)
                    )
                }
            };

            mockComposition = jasmine.createSpyObj('composition', [
                'on',
                'off',
                'load',
                'triggerCallback'
            ]);
            mockComposition.on.andCallFake(function (event, callback, context) {
                mockEventCallbacks[event] = callback.bind(context);
            });
            mockComposition.off.andCallFake(function (event) {
                unregisterSpies[event]();
            });
            mockComposition.load.andCallFake(function () {
                mockEventCallbacks.add(mockCompObject1);
                mockEventCallbacks.add(mockCompObject2);
                mockEventCallbacks.load();
            });
            mockComposition.triggerCallback.andCallFake(function (event) {
                if (event === 'add') {
                    mockEventCallbacks.add(mockCompObject3);
                } else if (event === 'remove') {
                    mockEventCallbacks.remove({
                        key: 'mockCompObject2'
                    });
                } else {
                    mockEventCallbacks[event]();
                }
            });

            mockTelemetryAPI = jasmine.createSpyObj('telemetryAPI', [
                'request',
                'canProvideTelemetry',
                'getMetadata',
                'subscribe',
                'triggerTelemetryCallback'
            ]);
            mockTelemetryAPI.request.andCallFake(function (obj) {
                return new Promise(function (resolve, reject) {
                    resolve(mockTelemetryValues[obj.identifer.key]);
                });
            });
            mockTelemetryAPI.canProvideTelemetry.andReturn(true);
            mockTelemetryAPI.getMetadata.andCallFake(function (obj) {
                return mockMetadataManagers[obj.identifier.key];
            });
            mockTelemetryAPI.subscribe.andCallFake(function (obj, callback) {
                mockTelemetryCallbacks[obj.identifier.key] = callback;
                return unsubscribeSpies[obj.identifier.key];
            });
            mockTelemetryAPI.triggerTelemetryCallback.andCallFake(function (key) {
                mockTelemetryCallbacks[key](mockTelemetryValues2[key]);
            });

            mockOpenMCT = {
                telemetry: mockTelemetryAPI,
                composition: {}
            };
            mockOpenMCT.composition.get = jasmine.createSpy('get').andReturn(mockComposition);

            loadCallbackSpy = jasmine.createSpy('loadCallbackSpy');
            addCallbackSpy = jasmine.createSpy('addCallbackSpy');
            removeCallbackSpy = jasmine.createSpy('removeCallbackSpy');
            metadataCallbackSpy = jasmine.createSpy('metadataCallbackSpy');
            telemetryCallbackSpy = jasmine.createSpy('telemetryCallbackSpy');

            conditionManager = new ConditionManager(mockDomainObject, mockOpenMCT);
            conditionManager.on('load', loadCallbackSpy);
            conditionManager.on('add', addCallbackSpy);
            conditionManager.on('remove', removeCallbackSpy);
            conditionManager.on('metadata', metadataCallbackSpy);
            conditionManager.on('receiveTelemetry', telemetryCallbackSpy);

            mockConditionEvaluator = jasmine.createSpy('mockConditionEvaluator');
            mockConditionEvaluator.execute = jasmine.createSpy('execute');
            conditionManager.evaluator = mockConditionEvaluator;
        });

        it('loads the initial composition and invokes the appropriate handlers', function () {
            mockComposition.triggerCallback('load');
            expect(conditionManager.getComposition()).toEqual({
                mockCompObject1: mockCompObject1,
                mockCompObject2: mockCompObject2
            });
            expect(loadCallbackSpy).toHaveBeenCalled();
            expect(conditionManager.loadCompleted()).toEqual(true);
        });

        it('loads metadata from composition and gets it upon request', function () {
            expect(conditionManager.getTelemetryMetadata('mockCompObject1'))
                .toEqual(mockMetadata.mockCompObject1);
            expect(conditionManager.getTelemetryMetadata('mockCompObject2'))
                .toEqual(mockMetadata.mockCompObject2);
        });

        it('maintains lists of global metadata, and does not duplicate repeated fields', function () {
            var allKeys = {
                property1: {
                    key: 'property1',
                    name: 'Property 1'
                },
                property2: {
                    key: 'property2',
                    name: 'Property 2'
                },
                property3: {
                    key: 'property3',
                    name: 'Property 3'
                },
                property4: {
                    key: 'property4',
                    name: 'Property 4'
                }
            };
            expect(conditionManager.getTelemetryMetadata('all')).toEqual(allKeys);
            expect(conditionManager.getTelemetryMetadata('any')).toEqual(allKeys);
            mockComposition.triggerCallback('add');
            expect(conditionManager.getTelemetryMetadata('all')).toEqual(allKeys);
            expect(conditionManager.getTelemetryMetadata('any')).toEqual(allKeys);
        });

        it('loads and gets telemetry property types', function () {
            conditionManager.parseAllPropertyTypes().then(function () {
                expect(conditionManager.getTelemetryPropertyType('mockCompObject1', 'property1'))
                    .toEqual('string');
                expect(conditionManager.getTelemetryPropertyType('mockCompObject2', 'property4'))
                    .toEqual('number');
                expect(conditionManager.metadataLoadComplete()).toEqual(true);
                expect(metadataCallbackSpy).toHaveBeenCalled();
            });
        });

        it('responds to a composition add event and invokes the appropriate handlers', function () {
            mockComposition.triggerCallback('add');
            expect(addCallbackSpy).toHaveBeenCalledWith(mockCompObject3);
            expect(conditionManager.getComposition()).toEqual({
                mockCompObject1: mockCompObject1,
                mockCompObject2: mockCompObject2,
                mockCompObject3: mockCompObject3
            });
        });

        it('responds to a composition remove event and invokes the appropriate handlers', function () {
            mockComposition.triggerCallback('remove');
            expect(removeCallbackSpy).toHaveBeenCalledWith({
                key: 'mockCompObject2'
            });
            expect(unsubscribeSpies.mockCompObject2).toHaveBeenCalled();
            expect(conditionManager.getComposition()).toEqual({
                mockCompObject1: mockCompObject1
            });
        });

        it('unregisters telemetry subscriptions and composition listeners on destroy', function () {
            mockComposition.triggerCallback('add');
            conditionManager.destroy();
            Object.values(unsubscribeSpies).forEach(function (spy) {
                expect(spy).toHaveBeenCalled();
            });
            Object.values(unregisterSpies).forEach(function (spy) {
                expect(spy).toHaveBeenCalled();
            });
        });

        it('populates its LAD cache with historial data on load, if available', function () {
            conditionManager.parseAllPropertyTypes().then(function () {
                expect(conditionManager.subscriptionCache.mockCompObject1.property1).toEqual('Its a string');
                expect(conditionManager.subscriptionCache.mockCompObject2.property4).toEqual(66);
            });
        });

        it('updates its LAD cache upon recieving telemetry and invokes the appropriate handlers', function () {
            mockTelemetryAPI.triggerTelemetryCallback('mockCompObject1');
            expect(conditionManager.subscriptionCache.mockCompObject1.property1).toEqual('Its a different string');
            mockTelemetryAPI.triggerTelemetryCallback('mockCompObject2');
            expect(conditionManager.subscriptionCache.mockCompObject2.property4).toEqual(22);
            expect(telemetryCallbackSpy).toHaveBeenCalled();
        });

        it('evalutes a set of rules and returns the id of the' +
           'last active rule, or the first if no rules are active', function () {
            var mockRuleOrder = ['default', 'rule0', 'rule1'],
                mockRules = {
                    default: {
                        getProperty: function () {}
                    },
                    rule0: {
                        getProperty: function () {}
                    },
                    rule1: {
                        getProperty: function () {}
                    }
                };

            mockConditionEvaluator.execute.andReturn(false);
            expect(conditionManager.executeRules(mockRuleOrder, mockRules)).toEqual('default');
            mockConditionEvaluator.execute.andReturn(true);
            expect(conditionManager.executeRules(mockRuleOrder, mockRules)).toEqual('rule1');
        });

        it('gets the human-readable name of a composition object', function () {
            expect(conditionManager.getObjectName('mockCompObject1')).toEqual('Object 1');
            expect(conditionManager.getObjectName('all')).toEqual('all Telemetry');
        });

        it('gets the human-readable name of a telemetry field', function () {
            conditionManager.parseAllPropertyTypes().then(function () {
                expect(conditionManager.getTelemetryPropertyName('mockCompObject1', 'property1'))
                    .toEqual('Property 1');
                expect(conditionManager.getTelemetryPropertyName('mockCompObject2', 'property4'))
                    .toEqual('Property 4');
            });
        });

        it('gets its associated ConditionEvaluator', function () {
            expect(conditionManager.getEvaluator()).toEqual(mockConditionEvaluator);
        });

        it('allows forcing a receive telemetry event', function () {
            conditionManager.triggerTelemetryCallback();
            expect(telemetryCallbackSpy).toHaveBeenCalled();
        });
    });
});
