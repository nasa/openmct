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

/**
 *  SearchSpec. Created by shale on 07/31/2015.
 */
define(
    ["../../src/controllers/SearchItemController"],
    function (SearchItemController) {
        "use strict";

        describe("The search item controller", function () {
            var mockScope,
                mockDomainObject1,
                mockDomainObject2,
                controller;

            beforeEach(function () {
                mockScope = jasmine.createSpyObj(
                    "$scope",
                    [ "$watch" ]
                );
                mockDomainObject1 = jasmine.createSpyObj(
                    "domainObject",
                    [ "getId" ]
                );
                mockDomainObject1.getId.andReturn("1");
                mockDomainObject2 = jasmine.createSpyObj(
                    "domainObject",
                    [ "getId" ]
                );
                mockDomainObject2.getId.andReturn("2");
                
                mockScope.ngModel = {};
                mockScope.ngModel.selectedObject = mockDomainObject1;
                mockScope.domainObject = mockDomainObject1;
                
                controller = new SearchItemController(mockScope);
            });
            
            it("keeps track of object selection", function () {
                expect(controller.isSelected()).toBeTruthy();
                
                mockScope.ngModel.selectedObject = mockDomainObject2;
                expect(mockScope.$watch).toHaveBeenCalled();
                mockScope.$watch.mostRecentCall.args[1](mockDomainObject2);
                expect(controller.isSelected()).toBeFalsy();
            });

        });
    }
);