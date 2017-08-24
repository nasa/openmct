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
            metadataCallbackSpy,
            mockTelemetryValues,
            mockTelemetryValues2;

        beforeEach(function () {
            mockDomainObject = {
                identifier: {
                    key: 'testKey',
                    name: "Test Object"
                },
                name: 'testName',
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
                }
            };
            mockCompObject2 = {
                identifier: {
                    key: 'mockCompObject2'
                }
            };
            mockCompObject3 = {
                identifier: {
                    key: 'mockCompObject3'
                }
            };
            mockMetadata = {
                mockCompObject1: {
                    property1: {
                        key: 'property1'
                    },
                    property2: {
                        key: 'property2'
                    }
                },
                mockCompObject2: {
                    property3: {
                        key: 'property3'
                    },
                    property4: {
                        key: 'property4'
                    }
                },
                mockCompObject3: {
                    property1: {
                        key: 'property1'
                    },
                    property2: {
                        key: 'property2'
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
                    property3: 'Execute:',
                    property4: 85
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

            conditionManager = new ConditionManager(mockDomainObject, mockOpenMCT);
            conditionManager.on('load', loadCallbackSpy);
            conditionManager.on('add', addCallbackSpy);
            conditionManager.on('remove', removeCallbackSpy);
            conditionManager.on('metadata', metadataCallbackSpy);
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
                    key: 'property1'
                },
                property2: {
                    key: 'property2'
                },
                property3: {
                    key: 'property3'
                },
                property4: {
                    key: 'property4'
                }
            };
            expect(conditionManager.getTelemetryMetadata('all')).toEqual(allKeys);
            expect(conditionManager.getTelemetryMetadata('any')).toEqual(allKeys);
            mockComposition.triggerCallback('add');
            expect(conditionManager.getTelemetryMetadata('all')).toEqual(allKeys);
            expect(conditionManager.getTelemetryMetadata('any')).toEqual(allKeys);
        });

        it('loads and gets telemetry property types', function () {
            conditionManager.loadMetadata().then(function () {
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
    });
});
