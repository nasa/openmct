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
        'zepto',
        './Indicator'
    ], function ($, Indicator) {

        var TEMPLATE = 
            '<mct-include ' +
            '   ng-model="indicator" ' +
            '   key="template" ' +
            '   class="status-block-holder" ' +
            '   ng-class="indicator.getGlyphClass()"> ' +
            ' </mct-include>';

        function displayLegacyIndicator(openmct, legacyIndicator, template) {
            return function () {
                var $compile = openmct.$injector.get('$compile');
                var $rootScope = openmct.$injector.get('$rootScope');
                var scope = $rootScope.$new(true);
                scope.indicator = legacyIndicator;
                scope.template = template || 'indicator';
                
                return $compile(TEMPLATE)(scope)[0];
            }
        }

        return displayLegacyIndicator;
});