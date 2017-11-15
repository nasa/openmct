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

define(['./Indicator', './LegacyIndicatorDisplay'], function (Indicator, LegacyIndicatorDisplay) {

    function IndicatorAPI(openmct) {
        this.openmct = openmct;
        this.indicators = [];

        openmct.on('start', onStart.bind(this))
    }

    IndicatorAPI.prototype.create = function () {
        var indicator = new Indicator();
        this.indicators.push(indicator);
        return indicator;
    }

    function onStart() {
        this.openmct.legacyExtension('starts', {
            depends: 'indicators',
            implementation: wrapLegacyIndicators.bind(this)
        });
    }

    function wrapLegacyIndicators(legacyIndicators) {
        this.indicators = 
            this.indicators.concat(legacyIndicators.map(function (legacyIndicatorDef) {
                var legacyIndicator;
                if (typeof legacyIndicatorDef === 'function') {
                    legacyIndicator = new legacyIndicatorDef();
                }
                
                var newStyleIndicator = new Indicator();
                newStyleIndicator.text(legacyIndicator.getText && legacyIndicator.getText());
                newStyleIndicator.description(legacyIndicator.getDescription && legacyIndicator.getDescription());
                newStyleIndicator.glyphClass(legacyIndicator.getGlyphClass && legacyIndicator.getGlyphClass());
                newStyleIndicator.cssClass(legacyIndicator.getCssClass && legacyIndicator.getCssClass());
                newStyleIndicator.display(LegacyIndicatorDisplay);

                return newStyleIndicator;
            }));
    }

    return IndicatorAPI;

});