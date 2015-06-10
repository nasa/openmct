/*global define,Promise,describe,it,expect,beforeEach,waitsFor,jasmine*/

define(
    ["../src/CompositionModelPolicy"],
    function (CompositionModelPolicy) {
        "use strict";

        describe("The composition model policy", function () {
            var mockType,
                policy;

            beforeEach(function () {
                mockType = jasmine.createSpyObj('type', ['getInitialModel']);
                policy = new CompositionModelPolicy();
            });

            it("only allows composition for types which will have a composition property", function () {
                mockType.getInitialModel.andReturn({});
                expect(policy.allow(mockType)).toBeFalsy();
                mockType.getInitialModel.andReturn({ composition: [] });
                expect(policy.allow(mockType)).toBeTruthy();
            });
        });

    }
);
