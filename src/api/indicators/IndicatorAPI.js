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
    './SimpleIndicator',
    '../../../platform/framework/src/Constants',
    'lodash'
], function (
    SimpleIndicator,
    Constants,
    _
) {

    var LEGACY_INDICATOR_TEMPLATE = 
        '<mct-include ' +
        '   ng-model="indicator" ' +
        '   key="template" ' +
        '   class="status-block-holder" ' +
        '   ng-class="indicator.getGlyphClass()"> ' +
        ' </mct-include>';

    function IndicatorAPI(openmct) {
        this.openmct = openmct;
        this.indicatorElements = [];
        this.promiseForAllElements = 
            fetchLegacyIndicators.call(this)
            .then(addLegacyIndicators.bind(this))
            .then(resolveWithAllIndicatorElements.bind(this));
    }

    IndicatorAPI.prototype.simpleIndicator = function () {
        return new SimpleIndicator(this.openmct);
    }

    /**
     * Accepts an indicator object, which is a simple object 
     * with a single attribute, 'element' which has an HTMLElement
     * as its value.
     * 
     * We provide .simpleIndicator() as a convenience function
     * which will create a default Open MCT indicator that can 
     * be passed to .add(indicator). This indicator also exposes 
     * functions for changing its appearance to support customization 
     * and dynamic behavior.
     * 
     * Eg.
     * var myIndicator = openmct.indicators.simpleIndicator();
     * openmct.indicators.add(myIndicator);
     * 
     * myIndicator.text("Hello World!");
     * myIndicator.iconClass("icon-info");
     * 
     */
    IndicatorAPI.prototype.add = function (indicator) {
        // So that we can consistently position indicator elements, 
        // guarantee that they are wrapped in an element we control
        var wrapperNode = document.createElement('div');
        wrapperNode.className = 'status-block-holder indicator';
        wrapperNode.appendChild(indicator.element);
        this.indicatorElements.push(wrapperNode);
    }

    /**
     * @private
     */
    IndicatorAPI.prototype.allIndicatorElements = function () {
        return this.promiseForAllElements;
    }

    function fetchLegacyIndicators() {
        return new Promise(function (resolve) {
            this.openmct.legacyExtension('runs', {
                depends: ['indicators[]'],
                implementation: resolve
            });
        }.bind(this));
    }

    function addLegacyIndicators(legacyIndicators) {
        legacyIndicators.forEach(function (legacyIndicatorDef){
            var legacyIndicator = initializeIfNeeded(legacyIndicatorDef);
            var legacyIndicatorElement = buildLegacyIndicator(this.openmct, legacyIndicator, legacyIndicatorDef.template);
            this.indicatorElements.push(legacyIndicatorElement);
        }.bind(this));
    }

    function initializeIfNeeded(legacyIndicatorDef) {
        if (typeof legacyIndicatorDef === 'function') {
            legacyIndicator = new legacyIndicatorDef();
        } else {
            legacyIndicator = legacyIndicatorDef;
        }
        return legacyIndicator;
    }

    function buildLegacyIndicator(openmct, legacyIndicator, template) {
        var $compile = openmct.$injector.get('$compile');
        var $rootScope = openmct.$injector.get('$rootScope');
        var scope = $rootScope.$new(true);
        scope.indicator = legacyIndicator;
        scope.template = template || 'indicator';
        
        return $compile(LEGACY_INDICATOR_TEMPLATE)(scope)[0];
    }

    function resolveWithAllIndicatorElements() {
        return this.indicatorElements;
    }

    return IndicatorAPI;

});
