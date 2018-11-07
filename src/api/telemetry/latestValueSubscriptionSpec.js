/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2018, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open openmct is licensed under the Apache License, Version 2.0 (the
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
 * Open openmct includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/
define([

], function (

) {

    describe("latestValueSubscription", function () {


        beforeEach(function () {

        });

        /** TODO:
         * test lad response inside bounds, outside bounds, no response.
         * test realtime should wait until lad response (all cases);
         * realtime should only notify if later than latest (or no latest).
         *
         * timesystem change should clear and re-request LAD.
         * clock change should enable/disable bounds filtering.
         * non-tick bounds change should clear and
         *
         *
         * should receive lad response
         * should receive realtime if later than lad.
         * should receive lad response (unless outside)
         * subscriptions should wait for lad response
         *
        */
        describe("no clock (AKA fixed)", function () {
            describe("nominal LAD response", function () {

            });
            describe("out of bounds LAD response", function () {

            });
            describe("no LAD response", function () {

            });
        });

        describe("with clock (AKA realtime)", function () {
            describe("nominal LAD response", function () {

            });
            describe("no LAD response", function () {

            });
        });
    });

});
