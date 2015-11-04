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
 * Created by shale on 08/24/2015.
 */
define(
    ["../../src/controllers/ObjectInspectorController"],
    function (ObjectInspectorController) {
        "use strict";

        describe("The object inspector controller ", function () {
            var mockScope,
                mockObjectService,
                mockPromise,
                mockDomainObject,
                mockContextCapability,
                mockLocationCapability,
                controller;

            beforeEach(function () {
                mockScope = jasmine.createSpyObj(
                    "$scope",
                    [ "$watch" ]
                );
                mockScope.ngModel = {};
                mockScope.ngModel.selectedObject = 'mock selected object';
                
                mockObjectService = jasmine.createSpyObj(
                    "objectService",
                    [ "getObjects" ]
                );
                mockPromise = jasmine.createSpyObj(
                    "promise",
                    [ "then" ]
                );
                mockObjectService.getObjects.andReturn(mockPromise);
                
                mockDomainObject = jasmine.createSpyObj(
                    "selectedObject",
                    [ "hasCapability", "getCapability", "useCapability", "getModel" ]
                );
                mockDomainObject.getModel.andReturn({location: 'somewhere'});
                mockDomainObject.hasCapability.andReturn(true);
                
                mockContextCapability = jasmine.createSpyObj(
                    "context capability",
                    [ "getParent" ]
                );
                mockLocationCapability = jasmine.createSpyObj(
                    "location capability",
                    [ "isLink" ]
                );
                mockDomainObject.getCapability.andCallFake(function (param) {
                    if (param === 'location') {
                        return mockLocationCapability;
                    } else if (param === 'context') {
                        return mockContextCapability;
                    }
                });
                
                controller = new ObjectInspectorController(mockScope, mockObjectService);
                
                // Change the selected object to trigger the watch call
                mockScope.ngModel.selectedObject = mockDomainObject;
            });

            it("watches for changes to the selected object", function () {
                expect(mockScope.$watch).toHaveBeenCalledWith('ngModel.selectedObject', jasmine.any(Function));
            });

            it("looks for contextual parent objects", function () {
                mockScope.$watch.mostRecentCall.args[1]();
                expect(mockContextCapability.getParent).toHaveBeenCalled();
            });

            it("if link, looks for primary parent objects", function () {
                mockLocationCapability.isLink.andReturn(true);
                
                mockScope.$watch.mostRecentCall.args[1]();
                expect(mockDomainObject.getModel).toHaveBeenCalled();
                expect(mockObjectService.getObjects).toHaveBeenCalled();
                mockPromise.then.mostRecentCall.args[0]({'somewhere': mockDomainObject});
            });
            
            it("gets metadata", function () {
                mockScope.$watch.mostRecentCall.args[1]();
                expect(mockDomainObject.useCapability).toHaveBeenCalledWith('metadata');
            });
        });
    }
);