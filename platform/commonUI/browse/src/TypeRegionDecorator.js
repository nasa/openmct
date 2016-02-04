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
        './InspectorRegion'
    ],
    function (InspectorRegion) {
        "use strict";

        /**
         * Adds default browse screen regions to Type definitions. Screen
         * regions are sections of the browse and edit view of an object
         * that can be customized on a per-type basis. Within
         * {@link Region}s are {@link RegionPart}s. Policies can be used to
         * decide which parts are visible or not based on object state.
         * @memberOf platform/commonUI/regions
         * @see {@link Region}, {@link RegionPart}, {@link EditableRegionPolicy}
         * @constructor
         */
        function TypeRegionDecorator(typeService) {
            this.typeService = typeService;
        }

        /**
         * Read Type bundle definition, and add default region definitions
         * if none provided.
         * @private
         * @param type
         * @returns {*}
         */
        TypeRegionDecorator.prototype.decorateType = function (type) {
            var regions = type.getDefinition().regions || {};

            regions.inspector = regions.inspector || new InspectorRegion();

            type.getDefinition().regions = regions;

            return type;
        };

        /**
         * Override the provider functions in order to return decorated Type
         * objects.
         * @returns {Array|*}
         */
        TypeRegionDecorator.prototype.listTypes = function() {
            var self = this,
                types = this.typeService.listTypes();

            return types.map(function (type) {
                return self.decorateType(type);
            });
        };

        /**
         * Override the provider function in order to return decorated Type
         * objects.
         * @param key
         */
        TypeRegionDecorator.prototype.getType = function(key) {
            var self = this,
                type = this.typeService.getType(key);

            return self.decorateType(type);
        };

        return TypeRegionDecorator;
    }
);
