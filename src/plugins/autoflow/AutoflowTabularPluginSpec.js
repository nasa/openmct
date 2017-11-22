/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2017, United States Government
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
    './AutoflowTabularPlugin',
    './AutoflowTabularView'
], function (AutoflowTabularPlugin, AutoflowTabularView) {
    describe("AutoflowTabularPlugin", function () {
        var testType;
        var testObject;
        var mockmct;

        beforeEach(function () {
            testType = "some-type";
            testObject = { type: testType };
            mockmct = {
                objectViews: jasmine.createSpyObj('views', ['addProvider'])
            };

            var plugin = new AutoflowTabularPlugin({ type: testType });
            plugin(mockmct);
        });

        it("installs a view provider", function () {
            expect(mockmct.objectViews.addProvider).toHaveBeenCalled();
        });

        describe("installs a view provider which", function () {
            var provider;

            beforeEach(function () {
                provider =
                    mockmct.objectViews.addProvider.mostRecentCall.args[0];
            });

            it("applies its view to the type from options", function () {
                expect(provider.canView(testObject)).toBe(true);
            });

            it("does not apply to other types", function () {
                expect(provider.canView({ type: 'foo' })).toBe(false);
            });

            it("provides an AutoflowTabularView", function () {
                expect(provider.view(testObject) instanceof AutoflowTabularView)
                    .toBe(true);
            });
        });
    });
});
