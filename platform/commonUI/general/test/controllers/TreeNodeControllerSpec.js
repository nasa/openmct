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
/*global define,Promise,describe,it,expect,beforeEach,waitsFor,jasmine*/

define(
    ["../../src/controllers/TreeNodeController"],
    function (TreeNodeController) {
        "use strict";

        describe("The tree node controller", function () {
            var mockScope,
                mockTimeout,
                mockAgentService,
                mockNgModel,
                mockDomainObject,
                controller;

            function TestObject(id, context) {
                return {
                    getId: function () { return id; },
                    getCapability: function (key) {
                        return key === 'context' ? context : undefined;
                    }
                };
            }

            beforeEach(function () {
                mockScope = jasmine.createSpyObj("$scope", ["$watch", "$on", "$emit"]);
                mockTimeout = jasmine.createSpy("$timeout");
                mockAgentService = jasmine.createSpyObj("agentService", ["isMobile", "isPhone", "getOrientation"]);
                mockNgModel = jasmine.createSpyObj("ngModel", ["selectedObject"]);
                mockDomainObject = jasmine.createSpyObj(
                    "domainObject",
                    [ "getId", "getCapability", "getModel", "useCapability" ]
                );
                
                mockAgentService.getOrientation.andReturn("portrait");
                mockAgentService.isPhone.andReturn(true);
                
                controller = new TreeNodeController(mockScope, mockTimeout, mockAgentService);
            });

            it("allows tracking of expansion state", function () {
                // The tree node tracks whether or not it has ever
                // been expanded in order to lazily load the expanded
                // portion of the tree.
                expect(controller.hasBeenExpanded()).toBeFalsy();
                controller.trackExpansion();

                // Expansion is tracked on a timeout, because too
                // much expansion can result in an unstable digest.
                expect(mockTimeout).toHaveBeenCalled();
                mockTimeout.mostRecentCall.args[0]();

                expect(controller.hasBeenExpanded()).toBeTruthy();
                controller.trackExpansion();
                expect(controller.hasBeenExpanded()).toBeTruthy();
            });

            it("tracks whether or not the represented object is currently navigated-to", function () {
                // This is needed to highlight the current selection
                var mockContext = jasmine.createSpyObj(
                        "context",
                        [ "getParent", "getPath", "getRoot" ]
                    ),
                    obj = new TestObject("test-object", mockContext);

                mockContext.getPath.andReturn([obj]);

                // Verify precondition
                expect(controller.isSelected()).toBeFalsy();

                // Change the represented domain object
                mockScope.domainObject = obj;

                // Invoke the watch with the new selection
                mockScope.$watch.calls[0].args[1](obj);

                expect(controller.isSelected()).toBeTruthy();
            });

            it("expands a node if it is on the navigation path", function () {
                var mockParentContext = jasmine.createSpyObj(
                        "parentContext",
                        [ "getParent", "getPath", "getRoot" ]
                    ),
                    mockChildContext = jasmine.createSpyObj(
                        "childContext",
                        [ "getParent", "getPath", "getRoot" ]
                    ),
                    parent = new TestObject("parent", mockParentContext),
                    child = new TestObject("child", mockChildContext);

                mockChildContext.getParent.andReturn(parent);
                mockChildContext.getPath.andReturn([parent, child]);
                mockParentContext.getPath.andReturn([parent]);

                // Set up such that we are on, but not at the end of, a path
                mockScope.ngModel = { selectedObject: child };
                mockScope.domainObject = parent;
                mockScope.toggle = jasmine.createSpyObj("toggle", ["setState"]);

                // Invoke the watch with the new selection
                mockScope.$watch.calls[0].args[1](child);

                // Expansion is tracked on a timeout, because too
                // much expansion can result in an unstable digest.
                // Trigger that timeout.
                expect(mockTimeout).toHaveBeenCalled();
                mockTimeout.mostRecentCall.args[0]();

                expect(mockScope.toggle.setState).toHaveBeenCalledWith(true);
                expect(controller.hasBeenExpanded()).toBeTruthy();
                expect(controller.isSelected()).toBeFalsy();

            });

            it("does not expand a node if it is not on the navigation path", function () {
                var mockParentContext = jasmine.createSpyObj(
                        "parentContext",
                        [ "getParent", "getPath", "getRoot" ]
                    ),
                    mockChildContext = jasmine.createSpyObj(
                        "childContext",
                        [ "getParent", "getPath", "getRoot" ]
                    ),
                    parent = new TestObject("parent", mockParentContext),
                    child = new TestObject("child", mockChildContext);

                mockChildContext.getParent.andReturn(parent);
                mockChildContext.getPath.andReturn([child, child]);
                mockParentContext.getPath.andReturn([parent]);

                // Set up such that we are on, but not at the end of, a path
                mockScope.ngModel = { selectedObject: child };
                mockScope.domainObject = parent;
                mockScope.toggle = jasmine.createSpyObj("toggle", ["setState"]);

                // Invoke the watch with the new selection
                mockScope.$watch.calls[0].args[1](child);

                // Expansion is tracked on a timeout, because too
                // much expansion can result in an unstable digest.
                // We want to make sure no timeouts are pending here.
                expect(mockTimeout).not.toHaveBeenCalled();
                expect(controller.hasBeenExpanded()).toBeFalsy();
                expect(controller.isSelected()).toBeFalsy();
            });


            it("does not expand a node if no context is available", function () {
                var mockParentContext = jasmine.createSpyObj(
                        "parentContext",
                        [ "getParent", "getPath", "getRoot" ]
                    ),
                    mockChildContext = jasmine.createSpyObj(
                        "childContext",
                        [ "getParent", "getPath", "getRoot" ]
                    ),
                    parent = new TestObject("parent", mockParentContext),
                    child = new TestObject("child", undefined);

                mockChildContext.getParent.andReturn(parent);
                mockChildContext.getPath.andReturn([parent, child]);
                mockParentContext.getPath.andReturn([parent]);

                // Set up such that we are on, but not at the end of, a path
                mockScope.ngModel = { selectedObject: child };
                mockScope.domainObject = parent;
                mockScope.toggle = jasmine.createSpyObj("toggle", ["setState"]);

                // Invoke the watch with the new selection
                mockScope.$watch.calls[0].args[1](child);

                expect(mockScope.toggle.setState).not.toHaveBeenCalled();
                expect(controller.hasBeenExpanded()).toBeFalsy();
                expect(controller.isSelected()).toBeFalsy();

            });
            
            it("check if tree node is in a mobile device", function () {
                if (controller) {
                    controller.checkMobile();
                }
            });
            
            it("allows a set object to emit select-obj", function () {
                controller.setObject(mockNgModel, mockDomainObject);
                expect(mockScope.$emit).toHaveBeenCalledWith('select-obj');
            });
        });
    }
);