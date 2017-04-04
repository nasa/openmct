
define(
    ["../src/MCTAutoflowTable"],
    function (MCTAutoflowTable) {

        describe("The mct-autoflow-table directive", function () {
            var mctAutoflowTable;

            beforeEach(function () {
                mctAutoflowTable = new MCTAutoflowTable();
            });

            // Real functionality is contained/tested in the linker,
            // so just check to make sure we're exposing the directive
            // appropriately.
            it("is applicable at the element level", function () {
                expect(mctAutoflowTable.restrict).toEqual("E");
            });

            it("two-ways binds needed scope variables", function () {
                expect(mctAutoflowTable.scope).toEqual({
                    objects: "=",
                    values: "=",
                    rows: "=",
                    updated: "=",
                    classes: "=",
                    columnWidth: "=",
                    counter: "="
                });
            });

            it("provides a link function", function () {
                expect(mctAutoflowTable.link).toEqual(jasmine.any(Function));
            });


        });
    }
);
