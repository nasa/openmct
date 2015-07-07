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

/**
 * MenuArrowControllerSpec. Created by shale on 07/02/2015.
 */
define(
    ["../src/MenuArrowController"],
    function (MenuArrowController) {
        "use strict";
        
        describe("The menu arrow controller ", function () {
            var mockScope,
                mockDomainObject,
                mockEvent,
                mockContextMenuAction,
                mockActionContext,
                controller;
            
            beforeEach(function () {
                mockScope = jasmine.createSpyObj(
                    "$scope",
                    [ "" ]
                );
                mockDomainObject = jasmine.createSpyObj(
                    "domainObject",
                    [ "getCapability" ]
                );
                mockEvent = jasmine.createSpyObj(
                    "event",
                    [ "preventDefault" ]
                );
                mockContextMenuAction = jasmine.createSpyObj(
                    "action",
                    [ "perform", "getActions" ]
                );
                mockActionContext = jasmine.createSpyObj(
                    "actionContext",
                    [ "" ]
                );
                
                mockActionContext.domainObject = mockDomainObject;
                mockActionContext.event = mockEvent;
                mockScope.domainObject = mockDomainObject;
                mockDomainObject.getCapability.andReturn(mockContextMenuAction);
                mockContextMenuAction.perform.andReturn(jasmine.any(Function));
                
                controller = new MenuArrowController(mockScope);
            });
            
            it("calls the context menu action when clicked", function () {
                // Simulate a click on the menu arrow
                controller.showMenu(mockEvent);
                
                // Expect the menu action to be performed 
                expect(mockDomainObject.getCapability).toHaveBeenCalledWith('action');
                expect(mockContextMenuAction.perform).toHaveBeenCalled();
            });
        });
    }
);
