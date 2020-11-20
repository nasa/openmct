/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2020, United States Government
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

import {
    createOpenMct,
    resetApplicationState
} from 'utils/testing';

describe("the inspector", () => {
    let openmct;

    beforeEach((done) => {
        openmct = createOpenMct();
        openmct.on('start', done);
        openmct.startHeadless();
    });

    afterEach(() => {
        return resetApplicationState(openmct);
    });

    describe("when not in edit mode", () => {
        describe("the saved styles inspector view", () => {
            it("should not be displayed", () => {

            });
        });
    });

    describe("when in edit mode", () => {
        describe("the saved styles inspector view", () => {
            it("should be displayed", () => {

            });

            it("should be display all saved styles", () => {

            });

            it("should allow a saved style to be applied", () => {

            });

            it("should allow a saved style to be deleted", () => {

            });
        });

        describe("the styles inspector view", () => {
            it("should allow a style to be saved", () => {

            });

            describe("when the number of saved styles is at the limit", () => {
                it("should prevent a style from being saved", () => {

                });
            });

            describe("when the selection has mixed styling", () => {
                it("should prevent the style from being saved", () => {

                });
            });

            describe("when the selection has non-specific font styling", () => {
                it("should prevent the style from being saved", () => {

                });
            });

            it("should allow a saved style to be applied", () => {

            });
        });
    });
});
