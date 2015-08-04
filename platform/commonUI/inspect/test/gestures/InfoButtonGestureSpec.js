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
    ['../../src/gestures/InfoButtonGesture'],
    function (InfoButtonGesture) {
        "use strict";

        describe("The info button gesture", function () {
            var mockDocument,
                mockAgentService,
                mockInfoService,
                testDelay = 12321,
                mockElement,
                mockDomainObject,
                mockScope,
                mockOff,
                testMetadata,
                mockPromise,
                mockHide,
                gesture;

            beforeEach(function () {
                mockDocument = jasmine.createSpyObj('$document', ['find']);
                mockAgentService = jasmine.createSpyObj('agentService', ['isMobile', 'isPhone']);
                mockInfoService = jasmine.createSpyObj(
                    'infoService',
                    [ 'display' ]
                );
                mockElement = jasmine.createSpyObj(
                    'element',
                    [ 'on', 'off', 'scope', 'css' ]
                );
                mockDomainObject = jasmine.createSpyObj(
                    'domainObject',
                    [ 'getId', 'getCapability', 'useCapability', 'getModel' ]
                );
                mockDocument = jasmine.createSpyObj('$document', ['find']);
                mockAgentService = jasmine.createSpyObj('agentService', ['isMobile']);
                mockInfoService = jasmine.createSpyObj(
                    'infoService',
                    [ 'display' ]
                );
                mockElement = jasmine.createSpyObj(
                    'element',
                    [ 'on', 'off', 'scope', 'css' ]
                );
                mockDomainObject = jasmine.createSpyObj(
                    'domainObject',
                    [ 'getId', 'getCapability', 'useCapability', 'getModel' ]
                );
                
                mockScope = jasmine.createSpyObj('$scope', [ '$on' ]);
                mockOff = jasmine.createSpy('$off');
                testMetadata = [ { name: "Test name", value: "Test value" } ];
                mockHide = jasmine.createSpy('hide');

                mockDomainObject.getModel.andReturn({ name: "Test Object" });
                mockDomainObject.useCapability.andCallFake(function (c) {
                    return (c === 'metadata') ? testMetadata : undefined;
                });
                mockElement.scope.andReturn(mockScope);
                mockScope.$on.andReturn(mockOff);
                mockInfoService.display.andReturn(mockHide);
                mockAgentService.isMobile.andReturn(true);
                gesture = new InfoButtonGesture(
                    mockDocument,
                    mockAgentService,
                    mockInfoService,
                    mockElement,
                    mockDomainObject
                );
            });
            
            it("listens for click on the representation", function () {
                expect(mockElement.on)
                    .toHaveBeenCalledWith('click', jasmine.any(Function));
            });

        });
    }
);
