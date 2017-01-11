
define(
    ["../src/CompositionModelPolicy"],
    (CompositionModelPolicy) => {

        describe("The composition model policy", () => {
            let mockType,
                policy;

            beforeEach( () => {
                mockType = jasmine.createSpyObj('type', ['getInitialModel']);
                policy = new CompositionModelPolicy();
            });

            it("only allows composition for types which will have a composition property", () => {
                mockType.getInitialModel.andReturn({});
                expect(policy.allow(mockType)).toBeFalsy();
                mockType.getInitialModel.andReturn({ composition: [] });
                expect(policy.allow(mockType)).toBeTruthy();
            });
        });

    }
);
