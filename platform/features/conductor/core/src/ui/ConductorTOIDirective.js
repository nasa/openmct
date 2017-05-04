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

define(['./ConductorTOIController'], function (ConductorTOIController) {
    /**
     * A directive that encapsulates the TOI specific behavior of the Time Conductor UI.
     * @constructor
     */
    function ConductorTOIDirective() {
        /**
         * The mct-conductor-axis renders a horizontal axis with regular
         * labelled 'ticks'. It requires 'start' and 'end' integer values to
         * be specified as attributes.
         */
        return {
            controller: [
                '$scope',
                'openmct',
                ConductorTOIController
            ],
            controllerAs: 'toi',
            scope: {
                viewService: "="
            },
            bindToController: true,

            restrict: 'E',
            priority: 1000,

            template:
                '<div class="l-data-visualization-holder l-row-elem flex-elem">' +
                '   <a class="l-page-button s-icon-button icon-pointer-left"></a>' +
                '   <div class="l-data-visualization" ng-click="toi.setTOIFromPosition($event)">' +
                '       <mct-include key="\'time-of-interest\'" class="l-toi-holder show-val" ' +
                '       ng-class="{ pinned: toi.pinned, \'val-to-left\': toi.left > 80 }" ' +
                '       ng-style="{\'left\': toi.left + \'%\'}"></mct-include>' +
                '   </div>' +
                '   <a class="l-page-button align-right s-icon-button icon-pointer-right"></a>' +
                '</div>'
        };
    }

    return ConductorTOIDirective;
});
