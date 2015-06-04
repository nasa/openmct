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
    ['../../src/gestures/InfoGesture'],
    function (InfoGesture) {
        "use strict";

        describe("The info gesture", function () {
            var mockTimeout,
                mockInfoService,
                testDelay = 12321,
                mockElement,
                mockDomainObject,
                mockScope,
                mockOff,
                gesture;

            beforeEach(function () {
                mockTimeout = jasmine.createSpy('$timeout');
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

                mockElement.scope.andReturn(mockScope);
                mockScope.$on.andReturn(mockOff);

                gesture = new InfoGesture(
                    mockTimeout,
                    mockInfoService,
                    testDelay,
                    mockElement,
                    mockDomainObject
                );
            });

            it("listens for mouseenter on the representation", function () {
                expect(mockElement.on)
                    .toHaveBeenCalledWith('mouseenter', jasmine.any(Function));
            });


        });
    }
);