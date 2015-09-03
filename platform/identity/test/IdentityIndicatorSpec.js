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
    ["../src/IdentityIndicator"],
    function (IdentityIndicator) {
        "use strict";

        describe("The identity indicator", function () {
            var mockPromise,
                mockIdentityService,
                indicator;

            beforeEach(function () {
                mockPromise = jasmine.createSpyObj('promise', ['then']);
                mockIdentityService = jasmine.createSpyObj(
                    'identityService',
                    ['getUser']
                );

                mockIdentityService.getUser.andReturn(mockPromise);

                indicator = new IdentityIndicator(mockIdentityService);
            });

            it("shows information about the current user", function () {
                mockPromise.then.mostRecentCall.args[0]({
                    key: "testuserid",
                    name: "A User"
                });
                // Should have a single character glyph
                expect(indicator.getGlyph().length).toEqual(1);
                expect(indicator.getGlyphClass()).toBeUndefined();
                expect(indicator.getText()).toEqual("A User");
                expect(indicator.getDescription().indexOf("testuserid"))
                    .not.toEqual(-1);
            });

            it("shows nothing while no user information is available", function () {
                expect(indicator.getGlyph()).toBeUndefined();
                expect(indicator.getGlyphClass()).toBeUndefined();
                expect(indicator.getText()).toBeUndefined();
                expect(indicator.getDescription()).toBeUndefined();
            });

            it("shows nothing when there is no identity information", function () {
                mockPromise.then.mostRecentCall.args[0](undefined);
                expect(indicator.getGlyph()).toBeUndefined();
                expect(indicator.getGlyphClass()).toBeUndefined();
                expect(indicator.getText()).toBeUndefined();
                expect(indicator.getDescription()).toBeUndefined();
            });

        });
    }
);
