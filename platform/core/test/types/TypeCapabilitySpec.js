/*global define,Promise,describe,it,expect,beforeEach,waitsFor,jasmine*/

/**
 * TypeCapabilitySpec. Created by vwoeltje on 11/6/14.
 */
define(
    ["../../src/types/TypeCapability"],
    function (TypeCapability) {
        "use strict";

        describe("The type capability", function () {
            var mockTypeService,
                mockDomainObject,
                mockType,
                type;

            beforeEach(function () {
                mockTypeService = jasmine.createSpyObj(
                    "typeService",
                    [ "getType" ]
                );
                mockDomainObject = jasmine.createSpyObj(
                    "domainObject",
                    [ "getId", "getModel", "getCapability" ]
                );
                mockType = { someKey: "some value" };

                mockTypeService.getType.andReturn(mockType);
                mockDomainObject.getModel.andReturn({type: "mockType"});

                type = new TypeCapability(mockTypeService, mockDomainObject);
            });

            it("looks up an object's type from type service", function () {
                expect(type).toEqual(mockType);
                expect(mockTypeService.getType).toHaveBeenCalledWith("mockType");
            });

        });
    }
);