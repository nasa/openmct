/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2017, United States Government
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
    './Indicator',
    './LegacyIndicator'
], function (
    Indicator,
    LegacyIndicator
) {

    function IndicatorAPI(openmct) {
        this.openmct = openmct;
        this.indicators = [];
        this.legacyIndicatorsPromise = new Promise(function (resolve) {
            this.resolveWithIndicators = resolve;
            onStartWrapLegacyIndicators.call(this);
        }.bind(this));
    }

    IndicatorAPI.prototype.create = function (displayFunction) {
        if (displayFunction !== undefined) {
            this.indicators.push(displayFunction);
        } else {
            var indicator = new Indicator(this.openmct);
            this.indicators.push(Indicator.defaultDisplayFunction.bind(indicator));
            return indicator;
        }
    }

    /**
     * @private
     */
    IndicatorAPI.prototype.displayFunctions = function () {
        return this.legacyIndicatorsPromise.then(function (legacyIndicators) {
            var wrappedLegacyIndicators = wrapAllLegacyIndicators.call(this, legacyIndicators);
            return this.indicators.concat(wrappedLegacyIndicators);
        }.bind(this));
    }

    function onStartWrapLegacyIndicators() {
        this.openmct.legacyExtension('runs', {
            depends: ['indicators[]'],
            implementation: this.resolveWithIndicators
        });
    }

    function wrapAllLegacyIndicators(legacyIndicators) {
        return legacyIndicators.map(convertToNewIndicator.bind(this));
    }

    function convertToNewIndicator(legacyIndicatorDef) {
        var legacyIndicator;
        if (typeof legacyIndicatorDef === 'function') {
            legacyIndicator = new legacyIndicatorDef();
        } else {
            legacyIndicator = legacyIndicatorDef;
        }
        
        var newStyleIndicator = new LegacyIndicator(this.openmct, legacyIndicator, legacyIndicatorDef.template);
        return LegacyIndicator.displayFunction.bind(newStyleIndicator);
    }

    return IndicatorAPI;

});
