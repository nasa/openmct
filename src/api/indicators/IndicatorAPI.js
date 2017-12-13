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
    './displayLegacyIndicator',
    '../../../platform/framework/src/Constants',
    'lodash'
], function (
    Indicator,
    displayLegacyIndicator,
    Constants,
    _
) {

    var DEFAULT_PRIORITY = Number.NEGATIVE_INFINITY;

    function IndicatorAPI(openmct) {
        this.openmct = openmct;
        this.displayFunctions = [];
        this.promiseForAllDisplayFunctions = 
            fetchLegacyIndicators.call(this)
            .then(addLegacyIndicators.bind(this))
            .then(resolveWithAllDisplayFunctions.bind(this));
    }

    IndicatorAPI.prototype.create = function (priority, displayFunction) {
        priority = getOrDefaultPriority(arguments);
        displayFunction = getDisplayFunctionFromArgs(arguments);

        if (displayFunction === undefined) {
            var indicator = new Indicator(this.openmct);
            displayFunction = Indicator.defaultDisplayFunction.bind(indicator);
            addDisplayFunctionWithPriority.call(this, displayFunction, priority);
            return indicator;
        } else {
            var wrappedDisplayFunction = wrapCustomDisplayFunction.call(this, displayFunction);
            addDisplayFunctionWithPriority.call(this, wrappedDisplayFunction, priority);
        }
    }

    function getOrDefaultPriority(args) {
        if (typeof args[0] === 'number') {
            return args[0];
        } else {
            return DEFAULT_PRIORITY;
        }
    }

    function getDisplayFunctionFromArgs(args) {
        if (typeof args[0] === 'function'){
            // No priority specified, display function is first argument
            return args[0];
        } else if (typeof args[1] === 'function') {
            // Priority is specified, so display function is second argument
            return args[1];
        } else {
            return undefined;
        }
    }

    /**
     * Wraps custom display functions in a DOM node with appropriate CSS rules. This allows
     * us to have some control over how custom indicators appear alongside non-custom indicators
     */
    function wrapCustomDisplayFunction(customDisplayFunction) {
        return function wrappedCustomDisplayFunction () {
            var providedNode = customDisplayFunction();
            var wrapperNode = document.createElement('div');
            wrapperNode.className = 'status-block-holder';
            wrapperNode.appendChild(providedNode);
            return wrapperNode;
        }
    }

    /**
     * @private
     */
    IndicatorAPI.prototype.allDisplayFunctions = function () {
        return this.promiseForAllDisplayFunctions;
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
            var indicatorDisplayFunction = displayLegacyIndicator(this.openmct, legacyIndicator, legacyIndicatorDef.template);
            var priority = parseLegacyPriority(legacyIndicatorDef.priority);

            addDisplayFunctionWithPriority.call(this, indicatorDisplayFunction, priority);    
        }.bind(this));
    }

    function addDisplayFunctionWithPriority(displayFunction, priority) {
        displayFunction._priority = priority;

        var insertionPoint = _.sortedIndex(this.displayFunctions, displayFunction, priorityDescending);
        this.displayFunctions.splice(insertionPoint, 0, displayFunction);
    }

    function priorityDescending (displayFunction) {
        // Sort in reverse order (so higher priority display functions at the front of the array)
        return -displayFunction._priority;
    }

    function initializeIfNeeded(legacyIndicatorDef) {
        if (typeof legacyIndicatorDef === 'function') {
            legacyIndicator = new legacyIndicatorDef();
        } else {
            legacyIndicator = legacyIndicatorDef;
        }
        return legacyIndicator;
    }

    function parseLegacyPriority(priority) {
        if (typeof(priority) === 'string') {
            priority = Constants.PRIORITY_LEVELS[priority];
        } else if (priority === undefined) {
            priority = DEFAULT_PRIORITY;
        }
        return priority;
    }

    function resolveWithAllDisplayFunctions() {
        return this.displayFunctions;
    }

    return IndicatorAPI;

});
