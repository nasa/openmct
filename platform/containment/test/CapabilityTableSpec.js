/*global define,Promise,describe,it,expect,beforeEach,waitsFor,jasmine*/

define(
    ["../src/CapabilityTable"],
    function (CapabilityTable) {
        "use strict";
        describe("Composition policy's capability table", function () {
            var mockTypeService,
                mockCapabilityService,
                mockTypes,
                table;

            beforeEach(function () {
                mockTypeService = jasmine.createSpyObj(
                    'typeService',
                    [ 'listTypes' ]
                );
                mockCapabilityService = jasmine.createSpyObj(
                    'capabilityService',
                    [ 'getCapabilities' ]
                );
                // Both types can only contain b, let's say
                mockTypes = ['a', 'b'].map(function (type, index) {
                    var mockType = jasmine.createSpyObj(
                        'type-' + type,
                        ['getKey', 'getDefinition', 'getInitialModel']
                    );
                    mockType.getKey.andReturn(type);
                    // Return a model to drive apparant capabilities
                    mockType.getInitialModel.andReturn({ id: type });
                    return mockType;
                });

                mockTypeService.listTypes.andReturn(mockTypes);
                mockCapabilityService.getCapabilities.andCallFake(function (model) {
                    var capabilities = {};
                    capabilities[model.id + '-capability'] = true;
                    return capabilities;
                });

                table = new CapabilityTable(
                    mockTypeService,
                    mockCapabilityService
                );
            });

            it("provides for lookup of capabilities by type", function () {
                // Based on initial model, should report the presence
                // of particular capabilities - suffixed above with -capability
                expect(table.hasCapability('a', 'a-capability'))
                    .toBeTruthy();
                expect(table.hasCapability('a', 'b-capability'))
                    .toBeFalsy();
                expect(table.hasCapability('a', 'c-capability'))
                    .toBeFalsy();
                expect(table.hasCapability('b', 'a-capability'))
                    .toBeFalsy();
                expect(table.hasCapability('b', 'b-capability'))
                    .toBeTruthy();
                expect(table.hasCapability('b', 'c-capability'))
                    .toBeFalsy();
            });

        });
    }
);