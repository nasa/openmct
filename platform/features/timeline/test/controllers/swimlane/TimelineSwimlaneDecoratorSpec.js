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
    ['../../../src/controllers/swimlane/TimelineSwimlaneDecorator'],
    function (TimelineSwimlaneDecorator) {
        'use strict';

        describe("A Timeline swimlane decorator", function () {
            var mockSwimlane,
                mockSelection,
                mockCapabilities,
                testModel,
                mockPromise,
                testModes,
                decorator;

            beforeEach(function () {
                mockSwimlane = {};
                mockCapabilities = {};
                testModel = {};
                testModes = ['a', 'b', 'c'];

                mockSelection = jasmine.createSpyObj('selection', ['select', 'get']);

                mockSwimlane.domainObject = jasmine.createSpyObj(
                    'domainObject',
                    [ 'getCapability', 'getModel' ]
                );

                mockCapabilities.mutation = jasmine.createSpyObj(
                    'mutation',
                    ['mutate']
                );
                mockCapabilities.persistence = jasmine.createSpyObj(
                    'persistence',
                    ['persist']
                );
                mockCapabilities.type = jasmine.createSpyObj(
                    'type',
                    ['instanceOf']
                );
                mockPromise = jasmine.createSpyObj('promise', ['then']);

                mockSwimlane.domainObject.getCapability.andCallFake(function (c) {
                    return mockCapabilities[c];
                });
                mockSwimlane.domainObject.getModel.andReturn(testModel);

                mockCapabilities.type.instanceOf.andReturn(true);
                mockCapabilities.mutation.mutate.andReturn(mockPromise);

                decorator = new TimelineSwimlaneDecorator(
                    mockSwimlane,
                    mockSelection
                );
            });

            it("returns the same object instance", function () {
                // Decoration should occur in-place
                expect(decorator).toBe(mockSwimlane);
            });

            it("adds a 'modes' getter-setter to activities", function () {
                expect(mockSwimlane.modes).toEqual(jasmine.any(Function));
                expect(mockCapabilities.type.instanceOf)
                    .toHaveBeenCalledWith('activity');
            });

            it("adds a 'link' getter-setter to activities", function () {
                expect(mockSwimlane.link).toEqual(jasmine.any(Function));
                expect(mockCapabilities.type.instanceOf)
                    .toHaveBeenCalledWith('activity');
            });

            it("gets modes from the domain object model", function () {
                testModel.relationships = { modes: ['a', 'b', 'c'] };
                expect(decorator.modes()).toEqual(['a', 'b', 'c']);
                testModel.relationships = { modes: ['x', 'y', 'z'] };
                expect(decorator.modes()).toEqual(['x', 'y', 'z']);
                // Verify that it worked as a getter
                expect(mockCapabilities.mutation.mutate)
                    .not.toHaveBeenCalled();
            });

            it("gets links from the domain object model", function () {
                testModel.link = "http://www.nasa.gov";
                expect(decorator.link()).toEqual("http://www.nasa.gov");
                // Verify that it worked as a getter
                expect(mockCapabilities.mutation.mutate)
                    .not.toHaveBeenCalled();
            });

            it("mutates modes when used as a setter", function () {
                decorator.modes(['abc', 'xyz']);
                expect(mockCapabilities.mutation.mutate)
                    .toHaveBeenCalledWith(jasmine.any(Function));
                mockCapabilities.mutation.mutate.mostRecentCall.args[0](testModel);
                expect(testModel.relationships.modes).toEqual(['abc', 'xyz']);

                // Verify that persistence is called when promise resolves
                expect(mockCapabilities.persistence.persist).not.toHaveBeenCalled();
                mockPromise.then.mostRecentCall.args[0]();
                expect(mockCapabilities.persistence.persist).toHaveBeenCalled();
            });

            it("mutates modes when used as a setter", function () {
                decorator.link("http://www.noaa.gov");
                expect(mockCapabilities.mutation.mutate)
                    .toHaveBeenCalledWith(jasmine.any(Function));
                mockCapabilities.mutation.mutate.mostRecentCall.args[0](testModel);
                expect(testModel.link).toEqual("http://www.noaa.gov");

                // Verify that persistence is called when promise resolves
                expect(mockCapabilities.persistence.persist).not.toHaveBeenCalled();
                mockPromise.then.mostRecentCall.args[0]();
                expect(mockCapabilities.persistence.persist).toHaveBeenCalled();
            });

            it("does not mutate modes when unchanged", function () {
                testModel.relationships = { modes: testModes };
                decorator.modes(testModes);
                expect(mockCapabilities.mutation.mutate).not.toHaveBeenCalled();
                expect(testModel.relationships.modes).toEqual(testModes);
            });

            it("does mutate modes when changed", function () {
                var testModes2 = ['d', 'e', 'f'];
                testModel.relationships = { modes: testModes };
                decorator.modes(testModes2);
                expect(mockCapabilities.mutation.mutate).toHaveBeenCalled();
                mockCapabilities.mutation.mutate.mostRecentCall.args[0](testModel);
                expect(testModel.relationships.modes).toBe(testModes2);
            });

            it("does not provide a 'remove' method with no parent", function () {
                expect(decorator.remove).not.toEqual(jasmine.any(Function));
            });

            it("fires the 'remove' action when remove is called", function () {
                var mockChild = jasmine.createSpyObj(
                        'childObject',
                        [ 'getCapability', 'getModel' ]
                    ),
                    mockAction = jasmine.createSpyObj(
                        'action',
                        [ 'perform' ]
                    );

                mockChild.getCapability.andCallFake(function (c) {
                    return c === 'action' ? mockAction : undefined;
                });

                // Create a child swimlane; it should have a remove action
                new TimelineSwimlaneDecorator({
                    domainObject: mockChild,
                    parent: decorator,
                    depth: 1
                }).remove();

                expect(mockChild.getCapability).toHaveBeenCalledWith('action');
                expect(mockAction.perform).toHaveBeenCalledWith('remove');
            });

            it("allows the swimlane to be selected", function () {
                decorator.select();
                expect(mockSelection.select).toHaveBeenCalledWith(decorator);
            });

            it("allows checking for swimlane selection state", function () {
                expect(decorator.selected()).toBeFalsy();
                mockSelection.get.andReturn(decorator);
                expect(decorator.selected()).toBeTruthy();
            });

        });

    }
);
