/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2018, United States Government
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

/**
 * MenuArrowControllerSpec. Created by shale on 07/02/2015.
 */
define(
    ["../src/MenuArrowController"],
    function (MenuArrowController) {

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
                    [""]
                );
                mockDomainObject = jasmine.createSpyObj(
                    "domainObject",
                    ["getCapability"]
                );
                mockEvent = jasmine.createSpyObj(
                    "event",
                    ["preventDefault"]
                );
                mockContextMenuAction = jasmine.createSpyObj(
                    "action",
                    ["perform", "getActions"]
                );
                mockActionContext = jasmine.createSpyObj(
                    "actionContext",
                    [""]
                );

                mockActionContext.domainObject = mockDomainObject;
                mockActionContext.event = mockEvent;
                mockScope.domainObject = mockDomainObject;
                mockDomainObject.getCapability.and.returnValue(mockContextMenuAction);
                mockContextMenuAction.perform.and.returnValue(jasmine.any(Function));

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
