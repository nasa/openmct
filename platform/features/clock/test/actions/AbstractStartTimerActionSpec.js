/*global define,describe,it,expect,beforeEach,waitsFor,jasmine,window,afterEach*/

define(
    ["../../src/actions/AbstractStartTimerAction"],
    function (AbstractStartTimerAction) {
        "use strict";

        describe("A timer's start/restart action", function () {
            var mockNow,
                mockDomainObject,
                mockPersistence,
                testModel,
                action;

            function asPromise(value) {
                return (value || {}).then ? value : {
                    then: function (callback) {
                        return asPromise(callback(value));
                    }
                };
            }

            beforeEach(function () {
                mockNow = jasmine.createSpy('now');
                mockDomainObject = jasmine.createSpyObj(
                    'domainObject',
                    [ 'getCapability', 'useCapability' ]
                );
                mockPersistence = jasmine.createSpyObj(
                    'persistence',
                    ['persist']
                );

                mockDomainObject.getCapability.andCallFake(function (c) {
                    return (c === 'persistence') && mockPersistence;
                });
                mockDomainObject.useCapability.andCallFake(function (c, v) {
                    if (c === 'mutation') {
                        testModel = v(testModel) || testModel;
                        return asPromise(true);
                    }
                });

                testModel = {};

                action = new AbstractStartTimerAction(mockNow, {
                    domainObject: mockDomainObject
                });
            });

            it("updates the model with a timestamp and persists", function () {
                mockNow.andReturn(12000);
                action.perform();
                expect(testModel.timestamp).toEqual(12000);
                expect(mockPersistence.persist).toHaveBeenCalled();
            });

            it("does not truncate milliseconds", function () {
                mockNow.andReturn(42321);
                action.perform();
                expect(testModel.timestamp).toEqual(42321);
                expect(mockPersistence.persist).toHaveBeenCalled();
            });
        });
    }
);
