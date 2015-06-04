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
/*global define,describe,it,expect,beforeEach,waitsFor,jasmine,runs*/

define(
    ["../../src/resolve/RequireConfigurator", "../../src/load/Bundle"],
    function (RequireConfigurator, Bundle) {
        "use strict";

        describe("The RequireJS configurator", function () {
            var mockRequire,
                configurator;

            beforeEach(function () {
                mockRequire = jasmine.createSpyObj(
                    "requirejs",
                    [ "config" ]
                );
                configurator = new RequireConfigurator(mockRequire);
            });

            it("configures RequireJS when invoked", function () {
                // Verify precondition - no config call
                expect(mockRequire.config).not.toHaveBeenCalled();
                // Configure with an empty set of bundles
                configurator.configure([]);
                // Should have invoked require.config
                expect(mockRequire.config).toHaveBeenCalled();
            });

            it("assembles configurations from bundles", function () {
                configurator.configure([
                    new Bundle("test/a", { configuration: {
                        paths: { a: "path/to/a", b: "path/to/b" }
                    } }),
                    new Bundle("test/b", { configuration: {
                        paths: { b: "path/to/b" },
                        shim: {
                            b: { "exports": "someExport" },
                            c: {}
                        }
                    } }),
                    new Bundle("test/c", { configuration: {
                        shim: {
                            c: { "exports": "someOtherExport" }
                        }
                    } })
                ]);

                expect(mockRequire.config).toHaveBeenCalledWith({
                    baseUrl: "",
                    paths: {
                        a: "test/a/lib/path/to/a",
                        b: "test/b/lib/path/to/b"
                    },
                    shim: {
                        b: { "exports": "someExport" },
                        c: { "exports": "someOtherExport" }
                    }
                });

            });
        });
    }
);