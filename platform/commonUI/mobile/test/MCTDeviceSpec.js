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

define(
    ['../src/MCTDevice'],
    (MCTDevice) => {

        const JQLITE_METHODS = ['replaceWith'];

        describe("The mct-device directive", () => {
            let mockAgentService,
                mockTransclude,
                mockElement,
                mockClone,
                testAttrs,
                directive;

            const link = () => {
                directive.link(null, mockElement, testAttrs, null, mockTransclude);
            }

            beforeEach( () => {
                mockAgentService = jasmine.createSpyObj(
                    "agentService",
                    ["isMobile", "isPhone", "isTablet", "isPortrait", "isLandscape"]
                );
                mockTransclude = jasmine.createSpy("$transclude");
                mockElement = jasmine.createSpyObj(name, JQLITE_METHODS);
                mockClone = jasmine.createSpyObj(name, JQLITE_METHODS);

                mockTransclude.andCallFake( (fn) => {
                    fn(mockClone);
                });

                // Look desktop-like by default
                mockAgentService.isLandscape.andReturn(true);

                testAttrs = {};

                directive = new MCTDevice(mockAgentService);
            });

            const expectInclusion = () => {
                expect(mockElement.replaceWith)
                    .toHaveBeenCalledWith(mockClone);
            }

            const expectExclusion = () => {
                expect(mockElement.replaceWith).not.toHaveBeenCalled();
            }

            it("is applicable at the attribute level", () => {
                expect(directive.restrict).toEqual("A");
            });

            it("transcludes at the element level", () => {
                expect(directive.transclude).toEqual('element');
            });

            it("has a greater priority number than ng-if", () => {
                expect(directive.priority > 600).toBeTruthy();
            });

            it("restricts element inclusion for mobile devices", () => {
                testAttrs.mctDevice = "mobile";
                link();
                expectExclusion();

                mockAgentService.isMobile.andReturn(true);
                link();
                expectInclusion();
            });

            it("restricts element inclusion for tablet devices", () => {
                testAttrs.mctDevice = "tablet";
                mockAgentService.isMobile.andReturn(true);
                link();
                expectExclusion();

                mockAgentService.isTablet.andReturn(true);
                link();
                expectInclusion();
            });

            it("restricts element inclusion for phone devices", () => {
                testAttrs.mctDevice = "phone";
                mockAgentService.isMobile.andReturn(true);
                link();
                expectExclusion();

                mockAgentService.isPhone.andReturn(true);
                link();
                expectInclusion();
            });

            it("restricts element inclusion for desktop devices", () => {
                testAttrs.mctDevice = "desktop";
                mockAgentService.isMobile.andReturn(true);
                link();
                expectExclusion();

                mockAgentService.isMobile.andReturn(false);
                link();
                expectInclusion();
            });

            it("restricts element inclusion for portrait orientation", () => {
                testAttrs.mctDevice = "portrait";
                link();
                expectExclusion();

                mockAgentService.isPortrait.andReturn(true);
                link();
                expectInclusion();
            });

            it("restricts element inclusion for landscape orientation", () => {
                testAttrs.mctDevice = "landscape";
                mockAgentService.isLandscape.andReturn(false);
                mockAgentService.isPortrait.andReturn(true);
                link();
                expectExclusion();

                mockAgentService.isLandscape.andReturn(true);
                link();
                expectInclusion();
            });

            it("allows multiple device characteristics to be requested", () => {
                // Won't try to test every permutation here, just
                // make sure the multi-characteristic feature has support.
                testAttrs.mctDevice = "portrait mobile";
                link();
                // Neither portrait nor mobile, not called
                expectExclusion();

                mockAgentService.isPortrait.andReturn(true);
                link();

                // Was portrait, but not mobile, so no
                expectExclusion();

                mockAgentService.isMobile.andReturn(true);
                link();
                expectInclusion();
            });
        });
    }
);
