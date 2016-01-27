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
/*global define*/

/**
 * This bundle implements object types and associated views for
 * display-building.
 * @namespace platform/features/layout
 */
define(
    [],
    function () {
        "use strict";

        /**
         * The LayoutController is responsible for supporting the
         * Layout view. It arranges frames according to saved configuration
         * and provides methods for updating these based on mouse
         * movement.
         * @memberof platform/features/layout
         * @constructor
         * @param {Scope} $scope the controller's Angular scope
         */
        function PlotOptionsController($scope) {
            var self = this,
                plotOptionsStructure = {
                    'name':'Plot Options',
                    'sections': [{
                        'rows':[
                            {
                                'name': 'Markers',
                                'control': 'checkbox',
                                'key': 'markers'
                            },
                            {
                                'name': 'No Line',
                                'control': 'checkbox',
                                'key': 'noLine'
                            },
                            {
                                'name': 'Step Line',
                                'control': 'checkbox',
                                'key': 'stepLine'
                            },
                            {
                                'name': 'Linear Line',
                                'control': 'checkbox',
                                'key': 'linearLine'
                            }
                        ]
                    }]},
                plotOptionsModel = {};

            $scope.plotOptionsStructure = plotOptionsStructure;
            $scope.plotOptionsModel = plotOptionsModel;

            $scope.domainObject.useCapability('composition').then(function(children){
                $scope.children = children;
            });



        }

        return PlotOptionsController;
    }
);

