/*global define,Promise,describe,it,expect,beforeEach,waitsFor,jasmine*/


define(
    ["../src/QueuingPersistenceCapabilityDecorator"],
    function (QueuingPersistenceCapabilityDecorator) {
        "use strict";

        describe("A queuing persistence capability decorator", function () {
            var mockQueue,
                mockCapabilityService,
                mockPersistenceConstructor,
                mockPersistence,
                mockDomainObject,
                testModel,
                decorator;

            beforeEach(function () {
                mockQueue = jasmine.createSpyObj('queue', ['put']);
                mockCapabilityService = jasmine.createSpyObj(
                    'capabilityService',
                    ['getCapabilities']
                );
                testModel = { someKey: "some value" };
                mockPersistence = jasmine.createSpyObj(
                    'persistence',
                    ['persist', 'refresh']
                );
                mockPersistenceConstructor = jasmine.createSpy();
                mockDomainObject = jasmine.createSpyObj(
                    'domainObject',
                    ['getId']
                );

                mockCapabilityService.getCapabilities.andReturn({
                    persistence: mockPersistenceConstructor
                });
                mockPersistenceConstructor.andReturn(mockPersistence);

                decorator = new QueuingPersistenceCapabilityDecorator(
                    mockQueue,
                    mockCapabilityService
                );
            });

            // Here, we verify that the decorator wraps the calls it is expected
            // to wrap; remaining responsibility belongs to
            // QueuingPersistenceCapability itself, which has its own tests.

            it("delegates to its wrapped service", function () {
                decorator.getCapabilities(testModel);
                expect(mockCapabilityService.getCapabilities)
                    .toHaveBeenCalledWith(testModel);
            });

            it("wraps its persistence capability's constructor", function () {
                decorator.getCapabilities(testModel).persistence(mockDomainObject);
                expect(mockPersistenceConstructor).toHaveBeenCalledWith(mockDomainObject);
            });

        });
    }
);