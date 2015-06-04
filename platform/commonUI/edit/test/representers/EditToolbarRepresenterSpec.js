/*****************************************************************************
 * Open MCT Web, Copyright (c) 2014-2015, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT Web is licensed under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 *
 * Open MCT Web includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/
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
                // A structure/state object should have been added to the
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
                representer.represent({});
                expect(mockScope.$watchCollection).toHaveBeenCalledWith(
                    jasmine.any(Function),
                    jasmine.any(Function)
                );
                expect(mockScope.$watchCollection.calls[0].args[0]())
                    .toBe(mockScope.$parent.testToolbar.state);
            });

            it("removes state from parent scope on destroy", function () {
                // Verify precondition
                expect(mockScope.$parent.testToolbar).toBeDefined();
                // Destroy the represeter
                representer.destroy();
                // Should have removed toolbar state from view
                expect(mockScope.$parent.testToolbar).toBeUndefined();
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
                mockScope.selection.select(testObject);
                expect(mockScope.$watchCollection.mostRecentCall.args[0])
                    .toEqual('selection.all()'); // Make sure we're using right watch
                mockScope.$watchCollection.mostRecentCall.args[1]([testObject]);

                // Update the state
                mockScope.$parent.testToolbar.state[0] = 456;
                // Invoke the first watch (assumed to be for toolbar state)
                mockScope.$watchCollection.calls[0].args[1](
                    mockScope.$parent.testToolbar.state
                );

                // Should have updated the original object
                expect(testObject.k).toEqual(456);

                // Should have committed the change
                expect(mockScope.commit).toHaveBeenCalled();
            });

            it("does not commit if nothing changed", function () {
                var testObject = { k: 123 };

                // Provide a view which has a toolbar
                representer.represent({
                    toolbar: { sections: [ { items: [ { property: 'k' } ] } ] }
                });

                // Update the selection
                mockScope.selection.select(testObject);
                expect(mockScope.$watchCollection.mostRecentCall.args[0])
                    .toEqual('selection.all()'); // Make sure we're using right watch
                mockScope.$watchCollection.mostRecentCall.args[1]([testObject]);

                // Invoke the first watch (assumed to be for toolbar state)
                mockScope.$watchCollection.calls[0].args[1](
                    mockScope.$parent.testToolbar.state
                );

                // Should have committed the change
                expect(mockScope.commit).not.toHaveBeenCalled();
            });

        });
    }
);