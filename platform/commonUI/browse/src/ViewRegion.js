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
/*global define,window*/

define(
    [
        '../../regions/src/Region'
    ],
    function (Region) {
        "use strict";

        /**
         * Defines the default View region. Captured in a class to
         * allow for modular extension and customization of regions based on
         * the typical case.
         * @memberOf platform/commonUI/regions
         * @constructor
         */
        function ViewRegion() {
            Region.call(this);

            this.buildRegion();
        }

        ViewRegion.prototype = Object.create(Region.prototype);
        ViewRegion.prototype.constructor = Region;

        /**
         * @private
         */
        ViewRegion.prototype.buildRegion = function() {
            var browseViewPart = {
                    name: 'browse-view',
                    title: 'Browse Object View',
                    modes: ['browse'],
                    content: {
                        key: 'browse-object'
                    }
                },
                editViewPart = {
                    name: 'edit-view',
                    title: 'Edit Object View',
                    modes: ['edit'],
                    content: {
                        key: 'edit-object'
                    }
                };
            this.addPart(browseViewPart);
            this.addPart(editViewPart);
        };

        return ViewRegion;
    }
);
