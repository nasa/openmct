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
/*global define,Promise*/

/**
 * Module defining ImageTelemetry. Created by vwoeltje on 06/22/15.
 */
define(
    [],
    function () {
        "use strict";

        var firstObservedTime = Date.now(),
            /*images = [
                "http://www.nasa.gov/393811main_Palomar_ao_bouchez_10s_after_impact_4x3_946-710.png",
                "http://www.nasa.gov/393821main_Palomar_ao_bouchez_15s_after_impact_4x3_946-710.png",
                "http://www.nasa.gov/images/content/393801main_CfhtVeillet2_4x3_516-387.jpg",
                "http://www.nasa.gov/images/content/392790main_1024_768_GeminiNorth_NightBeforeImpact_946-710.jpg"*/
            images = [
                "https://www.hq.nasa.gov/alsj/a16/AS16-117-18731.jpg",
                "https://www.hq.nasa.gov/alsj/a16/AS16-117-18732.jpg",
                "https://www.hq.nasa.gov/alsj/a16/AS16-117-18733.jpg",
                "https://www.hq.nasa.gov/alsj/a16/AS16-117-18734.jpg",
                "https://www.hq.nasa.gov/alsj/a16/AS16-117-18735.jpg",
                "https://www.hq.nasa.gov/alsj/a16/AS16-117-18736.jpg",
                "https://www.hq.nasa.gov/alsj/a16/AS16-117-18737.jpg",
                "https://www.hq.nasa.gov/alsj/a16/AS16-117-18738.jpg",
                "https://www.hq.nasa.gov/alsj/a16/AS16-117-18739.jpg",
                "https://www.hq.nasa.gov/alsj/a16/AS16-117-18740.jpg",
                "https://www.hq.nasa.gov/alsj/a16/AS16-117-18741.jpg",
                "https://www.hq.nasa.gov/alsj/a16/AS16-117-18742.jpg",
                "https://www.hq.nasa.gov/alsj/a16/AS16-117-18743.jpg",
                "https://www.hq.nasa.gov/alsj/a16/AS16-117-18744.jpg",
                "https://www.hq.nasa.gov/alsj/a16/AS16-117-18745.jpg",
                "https://www.hq.nasa.gov/alsj/a16/AS16-117-18746.jpg",
                "https://www.hq.nasa.gov/alsj/a16/AS16-117-18747.jpg",
                "https://www.hq.nasa.gov/alsj/a16/AS16-117-18748.jpg"

            ].map(function (url, index) {
                return {
                    timestamp: firstObservedTime + 1000 * index,
                    url: url
                };
            });


        /**
         *
         * @constructor
         */
        function ImageTelemetry() {
            return {
                getPointCount: function () {
                    return Math.floor((Date.now() - firstObservedTime) / 1000);
                },
                getDomainValue: function (i, domain) {
                    return images[i % images.length].timestamp;
                },
                getRangeValue: function (i, range) {
                    return images[i % images.length].url;
                }
            };
        }

        return ImageTelemetry;
    }
);
