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
    ['../../../src/controllers/drag/TimelineDragHandleFactory'],
    function (TimelineDragHandleFactory) {
        'use strict';

        describe("A Timeline drag handle factory", function () {
            var mockDragHandler,
                mockSnapHandler,
                mockDomainObject,
                mockType,
                testType,
                factory;

            beforeEach(function () {
                mockDragHandler = jasmine.createSpyObj(
                    'dragHandler',
                    [ 'start' ]
                );
                mockSnapHandler = jasmine.createSpyObj(
                    'snapHandler',
                    [ 'snap' ]
                );
                mockDomainObject = jasmine.createSpyObj(
                    'domainObject',
                    [ 'getCapability', 'getId' ]
                );
                mockType = jasmine.createSpyObj(
                    'type',
                    [ 'instanceOf' ]
                );

                mockDomainObject.getId.andReturn('test-id');
                mockDomainObject.getCapability.andReturn(mockType);
                mockType.instanceOf.andCallFake(function (t) {
                    return t === testType;
                });

                factory = new TimelineDragHandleFactory(
                    mockDragHandler,
                    mockSnapHandler
                );
            });

            it("inspects an object's type capability", function () {
                factory.handles(mockDomainObject);
                expect(mockDomainObject.getCapability)
                    .toHaveBeenCalledWith('type');
            });

            it("provides three handles for activities", function () {
                testType = "activity";
                expect(factory.handles(mockDomainObject).length)
                    .toEqual(3);
            });

            it("provides two handles for timelines", function () {
                testType = "timeline";
                expect(factory.handles(mockDomainObject).length)
                    .toEqual(2);
            });

        });
    }
);
