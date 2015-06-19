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
 * WindowTitlerSpec. Created by vwoeltje on 11/6/14.
 */
define(
    ["../../src/windowing/WindowTitler"],
    function (WindowTitler) {
        "use strict";

        describe("The window titler", function () {
            var mockNavigationService,
                mockRootScope,
                mockDocument,
                mockDomainObject,
                titler;

            beforeEach(function () {
                mockNavigationService = jasmine.createSpyObj(
                    'navigationService',
                    [ 'getNavigation' ]
                );
                mockRootScope = jasmine.createSpyObj(
                    '$rootScope',
                    [ '$watch' ]
                );
                mockDomainObject = jasmine.createSpyObj(
                    'domainObject',
                    ['getModel']
                );
                mockDocument = [{}];

                mockDomainObject.getModel.andReturn({ name: 'Test name' });
                mockNavigationService.getNavigation.andReturn(mockDomainObject);

                titler = new WindowTitler(
                    mockNavigationService,
                    mockRootScope,
                    mockDocument
                );
            });

            it("listens for changes to the name of the navigated object", function () {
                expect(mockRootScope.$watch).toHaveBeenCalledWith(
                    jasmine.any(Function),
                    jasmine.any(Function)
                );
                expect(mockRootScope.$watch.mostRecentCall.args[0]())
                    .toEqual('Test name');
            });

            it("sets the title to the name of the navigated object", function () {
                mockRootScope.$watch.mostRecentCall.args[1]("Some name");
                expect(mockDocument[0].title).toEqual("Some name");
            });

        });
    }
);