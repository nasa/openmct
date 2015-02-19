/*global define,describe,it,expect,beforeEach,jasmine*/

define(
    ["../../src/representers/EditToolbarRepresenter"],
    function (EditToolbarRepresenter) {
        "use strict";

        describe("The Edit mode toolbar representer", function () {
            var mockScope,
                mockElement,
                testAttrs,
                mockUnwatch,
                representer;

            beforeEach(function () {
                mockScope = jasmine.createSpyObj(
                    '$scope',
                    [ '$on', '$watch', '$watchCollection', "commit" ]
                );
                mockElement = {};
                testAttrs = { toolbar: 'testToolbar' };
                mockScope.$parent = jasmine.createSpyObj(
                    '$parent',
                    [ '$watch', '$watchCollection' ]
                );
                mockUnwatch = jasmine.createSpy('unwatch');

                mockScope.$parent.$watchCollection.andReturn(mockUnwatch);

                representer = new EditToolbarRepresenter(
                    mockScope,
                    mockElement,
                    testAttrs
                );
            });

            it("exposes toolbar state under a attr-defined name", function () {
                // A strucutre/state object should have been added to the
                // parent scope under the name provided in the "toolbar"
                // attribute
                expect(mockScope.$parent.testToolbar).toBeDefined();
            });

            it("is robust against lack of a toolbar definition", function () {
                expect(function () {
                    representer.represent({});
                }).not.toThrow();
            });

            it("watches for toolbar state changes", function () {
                expect(mockScope.$parent.$watchCollection).toHaveBeenCalledWith(
                    "testToolbar.state",
                    jasmine.any(Function)
                );
            });

            it("stops watching toolbar state when destroyed", function () {
                expect(mockUnwatch).not.toHaveBeenCalled();
                representer.destroy();
                expect(mockUnwatch).toHaveBeenCalled();
            });

            // Verify a simple interaction between selection state and toolbar
            // state; more complicated interactions are tested in EditToolbar.
            it("conveys state changes", function () {
                var testObject = { k: 123 };

                // Provide a view which has a toolbar
                representer.represent({
                    toolbar: { sections: [ { items: [ { property: 'k' } ] } ] }
                });

                // Update the selection
                mockScope.selection.push(testObject);
                expect(mockScope.$watchCollection.mostRecentCall.args[0])
                    .toEqual('selection'); // Make sure we're using right watch
                mockScope.$watchCollection.mostRecentCall.args[1]([testObject]);

                // Update the state
                mockScope.$parent.testToolbar.state[0] = 456;
                mockScope.$parent.$watchCollection.mostRecentCall.args[1](
                    mockScope.$parent.testToolbar.state
                );

                // Should have updated the original object
                expect(testObject.k).toEqual(456);
            });

        });
    }
);