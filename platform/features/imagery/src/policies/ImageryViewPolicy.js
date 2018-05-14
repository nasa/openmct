/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2018, United States Government
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

define([
    '../../../../../src/api/objects/object-utils'
], function (
    objectUtils
) {
    /**
     * Policy preventing the Imagery view from being made available for
     * domain objects which do not have associated image telemetry.
     * @implements {Policy.<View, DomainObject>}
     * @constructor
     */
    function ImageryViewPolicy(openmct) {
        this.openmct = openmct;
    }

    ImageryViewPolicy.prototype.hasImageTelemetry = function (domainObject) {
        var newDO = objectUtils.toNewFormat(
            domainObject.getModel(),
            domainObject.getId()
        );

        var metadata = this.openmct.telemetry.getMetadata(newDO);
        var values = metadata.valuesForHints(['image']);
        return values.length >= 1;
    };

    ImageryViewPolicy.prototype.allow = function (view, domainObject) {
        if (view.key === 'imagery' || view.key === 'historical-imagery') {
            return this.hasImageTelemetry(domainObject);
        }

        return true;
    };

    return ImageryViewPolicy;
});

