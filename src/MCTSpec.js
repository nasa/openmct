/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2021, United States Government
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
    './plugins/plugins',
    'legacyRegistry',
    'utils/testing'
], function (plugins, legacyRegistry, testUtils) {
    describe("MCT", function () {
        beforeEach(function () {
            this.mockPlugin = jasmine.createSpy('plugin');
            this.mockPlugin2 = jasmine.createSpy('plugin2');
            this.mockListener = jasmine.createSpy('listener');
            this.oldBundles = legacyRegistry.list();

            this.openmct = testUtils.createOpenMct();

            this.openmct.install(this.mockPlugin);
            this.openmct.install(this.mockPlugin2);
            this.openmct.once('start', this.mockListener);
        });

        // Clean up the dirty singleton.
        afterEach(function () {
            legacyRegistry.list().forEach(function (bundle) {
                if (this.oldBundles.indexOf(bundle) === -1) {
                    legacyRegistry.delete(bundle);
                }
            });

            return testUtils.resetApplicationState(this.openmct)
                .then(() => {
                    this.openmct = null;
                    this.mockPlugin = null;
                    this.mockPlugin2 = null;
                    this.mockListener = null;
                    this.oldBundles = null;
                    console.error('Done clearing test variables');
                });
        });

        it("exposes plugins", function () {
            expect(this.openmct.plugins).toEqual(plugins);
        });

        it("does not issue a start event before started", function () {
            expect(this.mockListener).not.toHaveBeenCalled();
        });

        describe("start", function () {
            beforeEach(function () {
                this.appHolder = document.createElement("div");

                const startPromise = new Promise(resolve => {
                    this.openmct.once('start', resolve);
                });

                this.openmct.startHeadless();

                return startPromise;
            });

            afterEach(() => {
                //this.appHolder.remove();
                this.appHolder = null;
            });

            fit("calls plugins for configuration", function () {
                expect(this.mockPlugin).toHaveBeenCalledWith(this.openmct);
                expect(this.mockPlugin2).toHaveBeenCalledWith(this.openmct);
            });

            it("emits a start event", function () {
                expect(this.mockListener).toHaveBeenCalled();
            });

            it("Renders the application into the provided container element", function () {
                let openMctShellElements = this.appHolder.querySelectorAll('div.l-shell');
                expect(openMctShellElements.length).toBe(1);
            });
        });

        describe("startHeadless", function () {
            beforeEach(function (done) {
                console.error('HERE');
                this.openmct.on('start', done);
                this.openmct.startHeadless();
            });

            it("calls plugins for configuration", function () {
                expect(this.mockPlugin).toHaveBeenCalledWith(this.openmct);
                expect(this.mockPlugin2).toHaveBeenCalledWith(this.openmct);
            });

            it("emits a start event", function () {
                expect(this.mockListener).toHaveBeenCalled();
            });

            it("Does not render Open MCT", function () {
                let openMctShellElements = document.body.querySelectorAll('div.l-shell');
                expect(openMctShellElements.length).toBe(0);
            });
        });

        describe("setAssetPath", function () {
            let testAssetPath;

            beforeEach(function () {
                this.openmct.legacyExtension = jasmine.createSpy('legacyExtension');
            });

            it("configures the path for assets", function () {
                testAssetPath = "some/path/";
                this.openmct.setAssetPath(testAssetPath);
                expect(this.openmct.getAssetPath()).toBe(testAssetPath);
            });

            it("adds a trailing /", function () {
                testAssetPath = "some/path";
                this.openmct.setAssetPath(testAssetPath);
                expect(this.openmct.getAssetPath()).toBe(testAssetPath + "/");
            });
        });
    });
});
