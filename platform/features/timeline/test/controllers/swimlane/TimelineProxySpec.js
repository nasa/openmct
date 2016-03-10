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
    ['../../../src/controllers/swimlane/TimelineProxy'],
    function (TimelineProxy) {
        'use strict';

        describe("The Timeline's selection proxy", function () {
            var mockDomainObject,
                mockSelection,
                mockActionCapability,
                mockActions,
                proxy;

            beforeEach(function () {
                mockDomainObject = jasmine.createSpyObj(
                    'domainObject',
                    ['getCapability']
                );
                mockSelection = jasmine.createSpyObj(
                    'selection',
                    [ 'get' ]
                );
                mockActionCapability = jasmine.createSpyObj(
                    'action',
                    [ 'getActions' ]
                );
                mockActions = ['a', 'b', 'c'].map(function (type) {
                    var mockAction = jasmine.createSpyObj(
                        'action-' + type,
                        [ 'perform', 'getMetadata' ]
                    );
                    mockAction.getMetadata.andReturn({ type: type });
                    return mockAction;
                });

                mockDomainObject.getCapability.andReturn(mockActionCapability);
                mockActionCapability.getActions.andReturn(mockActions);

                proxy = new TimelineProxy(mockDomainObject, mockSelection);
            });

            it("triggers a create action on add", function () {
                // Should trigger b's create action
                proxy.add('b');
                expect(mockActions[1].perform).toHaveBeenCalled();

                // Also check that other actions weren't invoked
                expect(mockActions[0].perform).not.toHaveBeenCalled();
                expect(mockActions[2].perform).not.toHaveBeenCalled();

                // Verify that interactions were for correct keys
                expect(mockDomainObject.getCapability)
                    .toHaveBeenCalledWith('action');
                expect(mockActionCapability.getActions)
                    .toHaveBeenCalledWith('add');
            });

            it("invokes the action on the selection, if any", function () {
                var mockOtherObject = jasmine.createSpyObj(
                        'other',
                        ['getCapability']
                    ),
                    mockOtherAction = jasmine.createSpyObj(
                        'actionCapability',
                        ['getActions']
                    ),
                    mockAction = jasmine.createSpyObj(
                        'action',
                        ['perform', 'getMetadata']
                    );

                // Set up mocks
                mockSelection.get.andReturn({ domainObject: mockOtherObject });
                mockOtherObject.getCapability.andReturn(mockOtherAction);
                mockOtherAction.getActions.andReturn([mockAction]);
                mockAction.getMetadata.andReturn({ type: 'z' });

                // Invoke add method; should create with selected object
                proxy.add('z');
                expect(mockAction.perform).toHaveBeenCalled();
            });


        });
    }
);
