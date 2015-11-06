/*****************************************************************************
 * Open MCT Web, Copyright (c) 2009-2015, United States Government
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
/*global define,describe,it,expect,beforeEach,waitsFor,jasmine,window,afterEach*/

define(
    ['../../../src/controllers/swimlane/TimelineSwimlane'],
    function (TimelineSwimlane) {
        'use strict';

        describe("A Timeline swimlane", function () {
            var parent,
                child,
                mockParentObject,
                mockChildObject,
                mockAssigner,
                mockActionCapability,
                mockParentTimespan,
                mockChildTimespan,
                testConfiguration;

            function asPromise(v) {
                return { then: function (cb) { cb(v); } };
            }

            beforeEach(function () {
                mockParentObject = jasmine.createSpyObj(
                    'parent',
                    ['getId', 'getCapability', 'useCapability', 'getModel']
                );
                mockChildObject = jasmine.createSpyObj(
                    'child',
                    ['getId', 'getCapability', 'useCapability', 'getModel']
                );
                mockAssigner = jasmine.createSpyObj(
                    'assigner',
                    ['get', 'assign', 'release']
                );
                mockParentTimespan = jasmine.createSpyObj(
                    'parentTimespan',
                    ['getStart', 'getEnd']
                );
                mockChildTimespan = jasmine.createSpyObj(
                    'childTimespan',
                    ['getStart', 'getEnd']
                );
                mockActionCapability = jasmine.createSpyObj('action', ['perform']);

                mockParentObject.getId.andReturn('test-parent');
                mockParentObject.getCapability.andReturn(mockActionCapability);
                mockParentObject.useCapability.andReturn(asPromise(mockParentTimespan));
                mockParentObject.getModel.andReturn({ name: "Test Parent" });
                mockChildObject.getModel.andReturn({ name: "Test Child" });
                mockChildObject.useCapability.andReturn(asPromise(mockChildTimespan));

                testConfiguration = { graph: {} };

                parent = new TimelineSwimlane(
                    mockParentObject,
                    mockAssigner,
                    testConfiguration
                );
                child = new TimelineSwimlane(
                    mockChildObject,
                    mockAssigner,
                    testConfiguration,
                    parent
                );
            });

            it("exposes its domain object", function () {
                expect(parent.domainObject).toEqual(mockParentObject);
                expect(child.domainObject).toEqual(mockChildObject);
            });

            it("exposes its depth", function () {
                expect(parent.depth).toEqual(0);
                expect(child.depth).toEqual(1);
                expect(new TimelineSwimlane(mockParentObject, {}, {}, child).depth)
                    .toEqual(2);
            });

            it("exposes its path as readable text", function () {
                var grandchild = new TimelineSwimlane(mockParentObject, {}, {}, child),
                    ggc = new TimelineSwimlane(mockParentObject, {}, {}, grandchild);

                expect(parent.path).toEqual("");
                expect(child.path).toEqual("");
                expect(grandchild.path).toEqual("Test Child > ");
                expect(ggc.path).toEqual("Test Child > Test Parent > ");
            });

            it("starts off expanded", function () {
                expect(parent.expanded).toBeTruthy();
                expect(child.expanded).toBeTruthy();
            });

            it("determines visibility based on parent expansion", function () {
                parent.expanded = false;
                expect(child.visible()).toBeFalsy();
                parent.expanded = true;
                expect(child.visible()).toBeTruthy();
            });

            it("is visible when it is the root of the timeline subgraph", function () {
                expect(parent.visible()).toBeTruthy();
            });

            it("fires the Edit Properties action on request", function () {
                parent.properties();
                expect(mockParentObject.getCapability).toHaveBeenCalledWith('action');
                expect(mockActionCapability.perform).toHaveBeenCalledWith('properties');
            });

            it("allows resource graph inclusion to be toggled", function () {
                expect(testConfiguration.graph['test-parent']).toBeFalsy();
                parent.toggleGraph();
                expect(testConfiguration.graph['test-parent']).toBeTruthy();
                parent.toggleGraph();
                expect(testConfiguration.graph['test-parent']).toBeFalsy();
            });

            it("provides a getter-setter for graph inclusion", function () {
                expect(testConfiguration.graph['test-parent']).toBeFalsy();
                expect(parent.graph(true)).toBeTruthy();
                expect(parent.graph()).toBeTruthy();
                expect(testConfiguration.graph['test-parent']).toBeTruthy();
                expect(parent.graph(false)).toBeFalsy();
                expect(parent.graph()).toBeFalsy();
                expect(testConfiguration.graph['test-parent']).toBeFalsy();
            });

            it("gets colors from the provided assigner", function () {
                mockAssigner.get.andReturn("#ABCABC");
                expect(parent.color()).toEqual("#ABCABC");
                // Verify that id was passed, and no other interactions
                expect(mockAssigner.get).toHaveBeenCalledWith('test-parent');
                expect(mockAssigner.assign).not.toHaveBeenCalled();
                expect(mockAssigner.release).not.toHaveBeenCalled();
            });

            it("allows colors to be set", function () {
                parent.color("#F0000D");
                expect(mockAssigner.assign).toHaveBeenCalledWith(
                    'test-parent',
                    "#F0000D"
                );
            });

            it("assigns colors when resource graph state is toggled", function () {
                expect(mockAssigner.assign).not.toHaveBeenCalled();
                parent.toggleGraph();
                expect(mockAssigner.assign).toHaveBeenCalledWith('test-parent');
                expect(mockAssigner.release).not.toHaveBeenCalled();
                parent.toggleGraph();
                expect(mockAssigner.release).toHaveBeenCalledWith('test-parent');
            });

            it("assigns colors when resource graph state is set", function () {
                expect(mockAssigner.assign).not.toHaveBeenCalled();
                parent.graph(true);
                expect(mockAssigner.assign).toHaveBeenCalledWith('test-parent');
                expect(mockAssigner.release).not.toHaveBeenCalled();
                parent.graph(false);
                expect(mockAssigner.release).toHaveBeenCalledWith('test-parent');
            });

            it("provides getter-setters for drag-drop highlights", function () {
                expect(parent.highlight()).toBeFalsy();
                parent.highlight(true);
                expect(parent.highlight()).toBeTruthy();

                expect(parent.highlightBottom()).toBeFalsy();
                parent.highlightBottom(true);
                expect(parent.highlightBottom()).toBeTruthy();
            });

            it("detects start/end violations", function () {
                mockParentTimespan.getStart.andReturn(42);
                mockParentTimespan.getEnd.andReturn(12321);

                // First, start with a valid timespan
                mockChildTimespan.getStart.andReturn(84);
                mockChildTimespan.getEnd.andReturn(100);
                expect(child.exceeded()).toBeFalsy();

                // Start time violation
                mockChildTimespan.getStart.andReturn(21);
                expect(child.exceeded()).toBeTruthy();

                // Now both in violation
                mockChildTimespan.getEnd.andReturn(20000);
                expect(child.exceeded()).toBeTruthy();

                // And just the end
                mockChildTimespan.getStart.andReturn(100);
                expect(child.exceeded()).toBeTruthy();

                // Now back to everything's-just-fine
                mockChildTimespan.getEnd.andReturn(10000);
                expect(child.exceeded()).toBeFalsy();
            });
        });
    }
);