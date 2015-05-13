/*global define,Promise,describe,it,expect,beforeEach,waitsFor,jasmine*/

define(
    ["../src/CompositionMutabilityPolicy"],
    function (CompositionMutabilityPolicy) {
        "use strict";

        describe("The composition mutability policy", function () {
            var mockType,
                policy;

            beforeEach(function () {
                mockType = jasmine.createSpyObj('type', ['hasFeature']);
                policy = new CompositionMutabilityPolicy();
            });

            it("only allows composition for types which will have a composition capability", function () {
                expect(policy.allow(mockType)).toBeFalsy();
                mockType.hasFeature.andReturn(true);
                expect(policy.allow(mockType)).toBeTruthy();
                expect(mockType.hasFeature).toHaveBeenCalledWith('creation');
            });
        });

    }
);