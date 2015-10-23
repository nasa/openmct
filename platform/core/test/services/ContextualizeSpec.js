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
    ["../../src/services/Contextualize"],
    function (Contextualize) {
        "use strict";

        var DOMAIN_OBJECT_METHODS = [
            'getId',
            'getModel',
            'getCapability',
            'hasCapability',
            'useCapability'
        ];

        describe("The 'contextualize' service", function () {
            var mockLog,
                mockDomainObject,
                mockParentObject,
                testParentModel,
                contextualize;

            beforeEach(function () {
                testParentModel = { composition: ["abc"] };

                mockLog = jasmine.createSpyObj(
                    "$log",
                    [ "error", "warn", "info", "debug" ]
                );

                mockDomainObject =
                    jasmine.createSpyObj('domainObject', DOMAIN_OBJECT_METHODS);
                mockParentObject =
                    jasmine.createSpyObj('parentObject', DOMAIN_OBJECT_METHODS);

                mockDomainObject.getId.andReturn("abc");
                mockDomainObject.getModel.andReturn({});
                mockParentObject.getId.andReturn("parent");
                mockParentObject.getModel.andReturn(testParentModel);

                contextualize = new Contextualize(mockLog);
            });

            it("attaches a context capability", function () {
                var contextualizedObject =
                    contextualize(mockDomainObject, mockParentObject);

                expect(contextualizedObject.getId()).toEqual("abc");
                expect(contextualizedObject.getCapability("context"))
                    .toBeDefined();
                expect(contextualizedObject.getCapability("context").getParent())
                    .toBe(mockParentObject);
            });

            it("issues a warning if composition does not match", function () {
                // Precondition - normally it should not issue a warning
                contextualize(mockDomainObject, mockParentObject);
                expect(mockLog.warn).not.toHaveBeenCalled();

                testParentModel.composition = ["xyz"];

                contextualize(mockDomainObject, mockParentObject);
                expect(mockLog.warn).toHaveBeenCalled();
            });


        });
    }
);
