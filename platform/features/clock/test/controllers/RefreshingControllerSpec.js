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
    ["../../src/controllers/RefreshingController"],
    function (RefreshingController) {
        "use strict";



        describe("The refreshing controller", function () {
            var mockScope,
                mockTicker,
                mockUnticker,
                controller;

            beforeEach(function () {
                mockScope = jasmine.createSpyObj('$scope', ['$on']);
                mockTicker = jasmine.createSpyObj('ticker', ['listen']);
                mockUnticker = jasmine.createSpy('unticker');

                mockTicker.listen.andReturn(mockUnticker);

                controller = new RefreshingController(mockScope, mockTicker);
            });

            it("refreshes the represented object on every tick", function () {
                var mockDomainObject = jasmine.createSpyObj(
                        'domainObject',
                        [ 'getCapability' ]
                    ),
                    mockPersistence = jasmine.createSpyObj(
                        'persistence',
                        [ 'persist', 'refresh' ]
                    );

                mockDomainObject.getCapability.andCallFake(function (c) {
                    return (c === 'persistence') && mockPersistence;
                });

                mockScope.domainObject = mockDomainObject;

                mockTicker.listen.mostRecentCall.args[0](12321);
                expect(mockPersistence.refresh).toHaveBeenCalled();
                expect(mockPersistence.persist).not.toHaveBeenCalled();
            });

            it("subscribes to clock ticks", function () {
                expect(mockTicker.listen)
                    .toHaveBeenCalledWith(jasmine.any(Function));
            });

            it("unsubscribes to ticks when destroyed", function () {
                // Make sure $destroy is being listened for...
                expect(mockScope.$on.mostRecentCall.args[0]).toEqual('$destroy');
                expect(mockUnticker).not.toHaveBeenCalled();

                // ...and makes sure that its listener unsubscribes from ticker
                mockScope.$on.mostRecentCall.args[1]();
                expect(mockUnticker).toHaveBeenCalled();
            });
        });
    }
);
