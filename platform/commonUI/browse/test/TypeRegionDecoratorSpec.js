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
 * MCTIncudeSpec. Created by vwoeltje on 11/6/14.
 */
define(
    ["../src/TypeRegionDecorator"],
    function (TypeRegionDecorator) {
        "use strict";

        describe("The type region decorator", function () {
            var typeRegionDecorator,
                mockTypeService,
                mockType,
                mockTypeDefinition;

            beforeEach(function () {
                mockTypeDefinition = {};

                mockType = jasmine.createSpyObj('type', [
                    'getDefinition'
                ]);
                mockType.getDefinition.andReturn(mockTypeDefinition);

                mockTypeService = jasmine.createSpyObj('typeService', [
                    'listTypes',
                    'getType'
                ]);
                mockTypeService.getType.andReturn(mockType);
                mockTypeService.listTypes.andReturn([mockType]);

                typeRegionDecorator = new TypeRegionDecorator(mockTypeService);
            });

            it("decorates individual type definitions with basic inspector" +
                " region", function () {
                typeRegionDecorator.getType('someType');
                expect(mockTypeDefinition.regions).toBeDefined();
            });

            it("decorates all type definitions with basic inspector" +
                " region", function () {
                typeRegionDecorator.listTypes();
                expect(mockTypeDefinition.regions).toBeDefined();
            });

        });
    }
);