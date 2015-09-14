/*global define,describe,it,expect,beforeEach,waitsFor,jasmine,window,afterEach*/

define(
    ['../../src/capabilities/CostCapability'],
    function (CostCapability) {
        'use strict';

        describe("A subsystem mode's cost capability", function () {
            var testModel,
                capability;

            beforeEach(function () {
                var mockDomainObject = jasmine.createSpyObj(
                    'domainObject',
                    [ 'getModel', 'getId' ]
                );

                testModel = {
                    resources: {
                        abc: -1,
                        power: 12321,
                        comms: 42
                    }
                };

                mockDomainObject.getModel.andReturn(testModel);

                capability = new CostCapability(mockDomainObject);
            });

            it("provides a list of resource types", function () {
                expect(capability.resources())
                    .toEqual(['abc', 'comms', 'power']);
            });

            it("provides resource costs", function () {
                expect(capability.cost('abc')).toEqual(-1);
                expect(capability.cost('power')).toEqual(12321);
                expect(capability.cost('comms')).toEqual(42);
            });

            it("provides all resources in a group", function () {
                expect(capability.invoke()).toEqual(testModel.resources);
            });

            it("applies to subsystem modes", function () {
                expect(CostCapability.appliesTo({
                    type: "warp.mode"
                })).toBeTruthy();
                expect(CostCapability.appliesTo({
                    type: "warp.activity"
                })).toBeFalsy();
                expect(CostCapability.appliesTo({
                    type: "warp.other"
                })).toBeFalsy();
            });

        });
    }
);