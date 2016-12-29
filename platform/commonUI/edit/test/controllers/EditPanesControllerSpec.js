/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2016, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT is licensed under the Apache License, Version 2.0 (the
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
 * Open MCT includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/

define(
    ["../../src/controllers/EditPanesController"],
    (EditPanesController) => {

        describe("The Edit Panes controller", () => {
            let mockScope,
                mockDomainObject,
                mockContext,
                controller;

            beforeEach( () => {
                mockScope = jasmine.createSpyObj("$scope", ["$watch"]);
                mockDomainObject = jasmine.createSpyObj(
                    'domainObject',
                    ['getId', 'getCapability']
                );
                mockContext = jasmine.createSpyObj(
                    'context',
                    ['getTrueRoot']
                );

                mockDomainObject.getId.andReturn('test-id');
                mockDomainObject.getCapability.andReturn(mockContext);

                // Return a new instance of the root object each time
                mockContext.getTrueRoot.andCallFake( () => {
                    let mockRoot = jasmine.createSpyObj('root', ['getId']);
                    mockRoot.getId.andReturn('root-id');
                    return mockRoot;
                });


                controller = new EditPanesController(mockScope);
            });

            it("watches for the domain object in view", () => {
                expect(mockScope.$watch).toHaveBeenCalledWith(
                    "domainObject",
                    jasmine.any(Function)
                );
            });

            it("exposes the root object found via the object's context capability", () => {
                mockScope.$watch.mostRecentCall.args[1](mockDomainObject);

                // Verify that the correct capability was used
                expect(mockDomainObject.getCapability)
                    .toHaveBeenCalledWith('context');

                // Should have exposed the root from getRoot
                expect(controller.getRoot().getId()).toEqual('root-id');
            });

            it("preserves the same root instance to avoid excessive refreshing", () => {
                let firstRoot;
                // Expose the domain object
                mockScope.$watch.mostRecentCall.args[1](mockDomainObject);
                firstRoot = controller.getRoot();
                // Update!
                mockScope.$watch.mostRecentCall.args[1](mockDomainObject);
                // Should still have the same object instance, to avoid
                // triggering the watch used by the template we're supporting
                expect(controller.getRoot()).toBe(firstRoot);
            });

            // Complements the test above; the object pointed to should change
            // when the actual root has changed (detected by identifier)
            it("updates the root when it changes", () => {
                let firstRoot;
                // Expose the domain object
                mockScope.$watch.mostRecentCall.args[1](mockDomainObject);
                firstRoot = controller.getRoot();

                // Change the exposed root
                mockContext.getTrueRoot.andCallFake( () => {
                    let mockRoot = jasmine.createSpyObj('root', ['getId']);
                    mockRoot.getId.andReturn('other-root-id');
                    return mockRoot;
                });

                // Update!
                mockScope.$watch.mostRecentCall.args[1](mockDomainObject);

                // Should still have the same object instance, to avoid
                // triggering the watch used by the template we're supporting
                expect(controller.getRoot()).not.toBe(firstRoot);
                expect(controller.getRoot().getId()).toEqual('other-root-id');
            });
        });
    }
);
