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
                "https://c1.staticflickr.com/9/8723/16813029640_9250a9a615_b.jpg",
                "http://cdn.inquisitr.com/wp-content/uploads/2015/09/UFO-Comet-Rosetta-boulder.jpg",
                "http://en.es-static.us/upl/2015/01/rosetta-comet-crack-OSIRIS-e1422270190774.jpg",
                "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2b/Vesta_darkside.jpg/768px-Vesta_darkside.jpg",
                "http://www.leonarddavid.com/wp-content/uploads/2016/01/Chury_2012.jpg",
                "https://upload.wikimedia.org/wikipedia/commons/6/67/Earth's_Moon.jpg",
                "https://upload.wikimedia.org/wikipedia/commons/1/17/Rosetta_triumphs_at_asteroid_Lutetia.jpg",
                "https://upload.wikimedia.org/wikipedia/commons/9/9d/243_Ida_large.jpg",
                "https://c1.staticflickr.com/1/150/436668227_e9ed29c6ed_b.jpg"
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
