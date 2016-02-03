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
         * Notes on implementation of plot options
         *
         * Multiple y-axes will have to be handled with multiple forms as
         * they will need to be stored on distinct model object
         *
         * Likewise plot series options per-child will need to be separate
         * forms.
         */

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
                domainObject = $scope.domainObject,
                xAxisForm = {
                'name':'x-axis',
                'sections': [{
                    'name': 'x-axis',
                    'rows': [
                        {
                            'name': 'Domain',
                            'control': 'select',
                            'key': 'key',
                            //TODO fetch options from platform or object type configuration
                            'options': [
                                {'name':'scet', 'value': 'scet'},
                                {'name':'sclk', 'value': 'sclk'},
                                {'name':'lst', 'value': 'lst'}
                            ]
                        }
                    ]
                }]},
                yAxisForm = {
                    'name':'y-axis',
                    'sections': [{
                    // Will need to be repeated for each y-axis, with a
                    // distinct name each. Ideally the name of the axis itself.
                    'name': 'y-axis',
                    'rows': [
                        {
                            'name': 'Autoscale',
                            'control': 'checkbox',
                            'key': 'autoscale',
                        },
                        {
                            'name': 'Min',
                            'control': 'textfield',
                            'key': 'min',
                            'pattern': '[0-9]'
                        },
                        {
                            'name': 'Max',
                            'control': 'textfield',
                            'key': 'min',
                            'pattern': '[0-9]'
                        },
                        {
                            'name': 'Range',
                            'control': 'select',
                            'key': 'key',
                            'options': [
                                {'name':'eu', 'value': 'eu'},
                                {'name':'dn', 'value': 'dn'},
                                {'name':'status', 'value': 'status'}
                            ]
                        }
                    ]
                    }]
                },
                plotSeriesForm = {
                    // For correctness of the rendered markup, repeated forms
                    // will probably need to have unique names.
                    'name': 'plotSeries',
                    'sections': [{
                        'name': 'Plot Series',
                        'rows': [
                            {
                                'name': 'Markers',
                                'control': 'checkbox',
                                'key': 'markers'
                            },
                            {
                                'name': 'No Line',
                                'control': 'radio',
                                'key': 'noLine'
                            },
                            {
                                'name': 'Step Line',
                                'control': 'radio',
                                'key': 'stepLine'
                            },
                            {
                                'name': 'Linear Line',
                                'control': 'radio',
                                'key': 'linearLine'
                            }
                        ]
                    }]
                },
                plotOptionsModel = {};

            /*domainObject.getModel().configuration.plot.xAxis= {
                'key': 'scet'
            };

            domainObject.getModel().configuration.plot.yAxis = [{
                    'autoscale': true,
                    'min': 0,
                    'max': 15,
                    'key': 'eu'
            }];

            domainObject.getModel().configuration.plot.series = [
                {
                    'id': '',
                    'lineStyle': '',
                    'color': '#aaddaa',
                    'interpolation': 'none'
                },
                //etc
            ];*/

            $scope.plotOptionsStructure = plotSeriesForm;
            $scope.plotOptionsModel = plotOptionsModel;

            function updateChildren() {
                domainObject.useCapability('composition').then(function(children){
                    $scope.children = children;
                });
            }

            /*
             Listen for changes to the domain object and update the object's
             children.
             */
            domainObject.getCapability('mutation').listen(function(model) {
                updateChildren();
            });

            updateChildren();

        }

        return PlotOptionsController;
    }
);

