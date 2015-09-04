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
            images = [
                "http://www.esa.int/var/esa/storage/images/esa_multimedia/images/2015/01/comet_on_16_january_2015_navcam/15205508-1-eng-GB/Comet_on_16_January_2015_NavCam.jpg",
                "http://www.esa.int/var/esa/storage/images/esa_multimedia/images/2014/08/comet_on_7_august_a/14721226-1-eng-GB/Comet_on_7_August_a_node_full_image_2.jpg",
                "http://http://resources0.news.com.au/images/2014/10/26/1227102/619948-e62d0d0c-5cb3-11e4-9c68-d403f5dcc36d.jpg",
                "http://www.esa.int/var/esa/storage/images/esa_multimedia/images/2014/08/comet_on_16_august_a/14735866-1-eng-GB/Comet_on_16_August_a_node_full_image_2.jpg",
			  	"http://www.esa.int/var/esa/storage/images/esa_multimedia/images/2015/08/year_at_a_comet_may_2015/15549436-1-eng-GB/Year_at_a_comet_May_2015_node_full_image_2.jpg"
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
