/*global define,describe,it,expect,beforeEach,waitsFor,jasmine,window,afterEach*/

define(
    ["../../src/actions/RestartTimerAction"],
    function (RestartTimerAction) {
        "use strict";

        describe("A timer's restart action", function () {
            var mockNow,
                mockDomainObject,
                mockPersistence,
                testModel,
                testContext,
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
                    [ 'getCapability', 'useCapability', 'getModel' ]
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
                mockDomainObject.getModel.andCallFake(function () {
                    return testModel;
                });

                testModel = {};
                testContext = { domainObject: mockDomainObject };

                action = new RestartTimerAction(mockNow, testContext);
            });

            it("updates the model with a timestamp and persists", function () {
                mockNow.andReturn(12000);
                action.perform();
                expect(testModel.timestamp).toEqual(12000);
                expect(mockPersistence.persist).toHaveBeenCalled();
            });

            it("applies only to timers with a target time", function () {
                testModel.type = 'timer';
                testModel.timestamp = 12000;
                expect(RestartTimerAction.appliesTo(testContext)).toBeTruthy();

                testModel.type = 'timer';
                testModel.timestamp = undefined;
                expect(RestartTimerAction.appliesTo(testContext)).toBeFalsy();

                testModel.type = 'clock';
                testModel.timestamp = 12000;
                expect(RestartTimerAction.appliesTo(testContext)).toBeFalsy();
            });
        });
    }
);
