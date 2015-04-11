/*global define,Promise,describe,it,expect,beforeEach,waitsFor,jasmine*/

define(
    ["../src/CompositionPolicy"],
    function (CompositionPolicy) {
        "use strict";
        describe("Composition policy", function () {
            var mockInjector,
                mockTypeService,
                mockCapabilityService,
                mockTypes,
                policy;

            beforeEach(function () {
                mockInjector = jasmine.createSpyObj('$injector', ['get']);
                mockTypeService = jasmine.createSpyObj(
                    'typeService',
                    [ 'listTypes' ]
                );
                mockCapabilityService = jasmine.createSpyObj(
                    'capabilityService',
                    [ 'getCapabilities' ]
                );
                // Both types can only contain b, let's say
                mockTypes = ['a', 'b'].map(function (type) {
                    var mockType = jasmine.createSpyObj(
                        'type-' + type,
                        ['getKey', 'getDefinition', 'getInitialModel']
                    );
                    mockType.getKey.andReturn(type);
                    mockType.getDefinition.andReturn({
                        contains: ['b']
                    });
                    mockType.getInitialModel.andReturn({});
                    return mockType;
                });

                mockInjector.get.andCallFake(function (name) {
                    return {
                        typeService: mockTypeService,
                        capabilityService: mockCapabilityService
                    }[name];
                });

                mockTypeService.listTypes.andReturn(mockTypes);
                mockCapabilityService.getCapabilities.andReturn({});

                policy = new CompositionPolicy(mockInjector);
            });

            it("enforces containment rules defined by types", function () {
                expect(policy.allow(mockTypes[0], mockTypes[1]))
                    .toBeTruthy();
                expect(policy.allow(mockTypes[1], mockTypes[1]))
                    .toBeTruthy();
                expect(policy.allow(mockTypes[1], mockTypes[0]))
                    .toBeFalsy();
                expect(policy.allow(mockTypes[0], mockTypes[0]))
                    .toBeFalsy();
            });

        });
    }
);