/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2016, United States Government
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

define([
    './MCT',
    './plugins/plugins'
], function (MCT, plugins) {
    describe("MCT", function () {
        var openmct;
        var mockPlugin;
        var mockPlugin2;

        beforeEach(function () {
            mockPlugin = jasmine.createSpy('plugin');
            mockPlugin2 = jasmine.createSpy('plugin');

            openmct = new MCT();

            openmct.install(mockPlugin);
            openmct.install(mockPlugin2);
        });

        it("exposes plugins", function () {
            expect(openmct.plugins).toEqual(plugins);
        });

        describe("start", function () {
            beforeEach(function () {
                openmct.start();
            });

            it("calls plugins for configuration", function () {
                expect(mockPlugin).toHaveBeenCalledWith(openmct);
                expect(mockPlugin2).toHaveBeenCalledWith(openmct);
            });
        });

        describe("setAssetPath", function () {
            var testAssetPath;

            beforeEach(function () {
                testAssetPath = "some/path";
                openmct.legacyExtension = jasmine.createSpy('legacyExtension');
                openmct.setAssetPath(testAssetPath);
            });

            it("internally configures the path for assets", function () {
                expect(openmct.legacyExtension).toHaveBeenCalledWith(
                    'constants',
                    {
                        key: "ASSETS_PATH",
                        value: testAssetPath
                    }
                );
            });
        });
    });
});
