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
/*global define,Promise,describe,it,expect,beforeEach,waitsFor,jasmine,runs*/

/**
 * BundleResolverSpec. Created by vwoeltje on 11/6/14.
 */
define(
    ["../../src/resolve/BundleResolver", "../../src/load/Bundle"],
    function (BundleResolver, Bundle) {
        "use strict";

        describe("The bundle resolver", function () {
            var mockExtensionResolver,
                mockRequireConfigurator,
                mockLog,
                resolver;

            beforeEach(function () {
                mockExtensionResolver = jasmine.createSpyObj(
                    "extensionResolver",
                    ["resolve"]
                );
                mockRequireConfigurator = jasmine.createSpyObj(
                    "requireConfigurator",
                    ["configure"]
                );
                mockLog = jasmine.createSpyObj(
                    "$log",
                    ["error", "warn", "info", "debug"]
                );

                mockExtensionResolver.resolve.andReturn(Promise.resolve("a"));

                resolver = new BundleResolver(
                    mockExtensionResolver,
                    mockRequireConfigurator,
                    mockLog
                );
            });

            it("invokes the extension resolver for all bundle extensions", function () {
                var result;

                resolver.resolveBundles([
                    new Bundle("x", { extensions: { tests: [ {}, {}, {} ] } }),
                    new Bundle("y", { extensions: { tests: [ {}, {} ], others: [ {}, {} ] } }),
                    new Bundle("z", { extensions: { others: [ {} ] } })
                ]).then(function (v) { result = v; });

                waitsFor(
                    function () { return result !== undefined; },
                    "promise resolution",
                    250
                );

                // Should get back the result from the resolver, and
                // should be binned by extension category.
                runs(function () {
                    expect(result.tests).toEqual(["a", "a", "a", "a", "a"]);
                    expect(result.others).toEqual(["a", "a", "a"]);
                });
            });

            it("configures require before loading implementations", function () {
                var bundles = [
                    new Bundle("x", { extensions: { tests: [ {}, {}, {} ] } }),
                    new Bundle("y", { extensions: { tests: [ {}, {} ], others: [ {}, {} ] } }),
                    new Bundle("z", { extensions: { others: [ {} ] } })
                ];

                resolver.resolveBundles(bundles);
                expect(mockRequireConfigurator.configure)
                    .toHaveBeenCalledWith(bundles);
            });

        });
    }
);