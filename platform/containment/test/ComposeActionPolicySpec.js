/*global define,Promise,describe,it,expect,beforeEach,waitsFor,jasmine*/

define(
    ["../src/ComposeActionPolicy"],
    function (ComposeActionPolicy) {
        "use strict";
        describe("The compose action policy", function () {
            var mockInjector,
                mockPolicyService,
                mockTypes,
                mockDomainObjects,
                mockAction,
                testContext,
                policy;

            beforeEach(function () {
                mockInjector = jasmine.createSpyObj('$injector', ['get']);
                mockPolicyService = jasmine.createSpyObj(
                    'policyService',
                    [ 'allow' ]
                );
                mockTypes = ['a', 'b'].map(function (type) {
                    var mockType = jasmine.createSpyObj('type-' + type, ['getKey']);
                    mockType.getKey.andReturn(type);
                    return mockType;
                });
                mockDomainObjects = ['a', 'b'].map(function (id, index) {
                    var mockDomainObject = jasmine.createSpyObj(
                        'domainObject-' + id,
                        ['getId', 'getCapability']
                    );
                    mockDomainObject.getId.andReturn(id);
                    mockDomainObject.getCapability.andCallFake(function (c) {
                        return c === 'type' && mockTypes[index];
                    });
                    return mockDomainObject;
                });
                mockAction = jasmine.createSpyObj('action', ['getMetadata']);

                testContext = {
                    key: 'compose',
                    domainObject: mockDomainObjects[0],
                    selectedObject: mockDomainObjects[1]
                };

                mockAction.getMetadata.andReturn(testContext);
                mockInjector.get.andCallFake(function (service) {
                    return service === 'policyService' && mockPolicyService;
                });

                policy = new ComposeActionPolicy(mockInjector);
            });

            it("defers to composition policy", function () {
                mockPolicyService.allow.andReturn(false);
                expect(policy.allow(mockAction, testContext)).toBeFalsy();
                mockPolicyService.allow.andReturn(true);
                expect(policy.allow(mockAction, testContext)).toBeTruthy();

                expect(mockPolicyService.allow).toHaveBeenCalledWith(
                    'composition',
                    mockTypes[0],
                    mockTypes[1]
                );
            });

            it("allows actions other than compose", function () {
                testContext.key = 'somethingElse';
                mockPolicyService.allow.andReturn(false);
                expect(policy.allow(mockAction, testContext)).toBeTruthy();
            });
        });
    }
);