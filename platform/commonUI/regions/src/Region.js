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

function Region(configuration) {
    configuration = configuration || {};
    this.name = configuration.name;
    this.content = configuration.content;
    this.modes = configuration.modes;

    this.regions = [];
}

/**
 * Adds a sub-region to this region.
 * @param {Region} region the part to add
 * @param {number} [index] the position to insert the region. By default
 * will add to the end
 */
Region.prototype.addRegion = function (region, index) {
    if (index) {
        this.regions.splice(index, 0, region);
    } else {
        this.regions.push(region);
    }
};

/**
 * Removes a sub-region from this region.
 * @param {Region | number | strnig} region The region to
 * remove. If a number, will remove the region at that index. If a
 * string, will remove the region with the matching name. If an
 * object, will attempt to remove that object from the Region
 */
Region.prototype.removeRegion = function (region) {
    if (typeof region === 'number') {
        this.regions.splice(region, 1);
    } else if (typeof region === 'string') {
        this.regions = this.regions.filter(function (thisRegion) {
            return thisRegion.name !== region;
        });
    } else {
        this.regions.splice(this.regions.indexOf(region), 1);
    }
};

export default Region;