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
    [],
    function () {
        "use strict";

        /**
         * @typeDef {object} PartContents
         * @property {string} key If the part is defined as a
         * representation, the key corresponding to the representation.
         * @memberOf platform/commonUI/regions
         */

        /**
         * @typeDef {object} RegionPart
         * @property {string} name A unique name for this region part
         * @property {PartContents} content the details of the region part
         * being defined
         * @property {Array<string>} [modes] the modes that this region part
         * should be included in. Options are 'edit' and 'browse'. By
         * default, will be included in both. Inclusion of region parts is
         * determined by policies of category 'region'. By default, the
         * {EditableRegionPolicy} will be applied.
         * @memberOf platform/commonUI/regions
         */

        /**
         * Defines the interface for a screen region. A screen region is a
         * section of the browse an edit screens for an object. Regions are
         * declared in object type definitions.
         * @memberOf platform/commonUI/regions
         * @abstract
         * @constructor
         */
        function Region() {
            this.parts = [];
        }

        /**
         * Adds a part to this region.
         * @param {RegionPart} part the part to add
         * @param {number} [index] the position to insert the part. By default
         * will add to the end
         */
        Region.prototype.addPart = function (part, index){
            if (index) {
                this.parts.splice(index, 0, part);
            } else {
                this.parts.push(part);
            }
        };

        /**
         * Removes a part from this region.
         * @param {RegionPart | number | strnig} part The region part to
         * remove. If a number, will remove the part at that index. If a
         * string, will remove the part with the matching name. If an
         * object, will attempt to remove that object from the Region
         */
        Region.prototype.removePart = function (part){
            if (typeof part === 'number') {
                this.parts.splice(part, 1);
            } else if (typeof part === 'string'){
                this.parts = this.parts.filter(function(thisPart) {
                    return thisPart.name !== part;
                });
            } else {
                this.parts.splice(this.parts.indexOf(part), 1);
            }
        };

        return Region;
    }
);
