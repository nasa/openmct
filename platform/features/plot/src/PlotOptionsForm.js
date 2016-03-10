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

define(
    [],
    function () {
        "use strict";

        /**
         * A class for encapsulating structure and behaviour of the plot
         * options form
         * @memberOf platform/features/plot
         * @param topic
         * @constructor
         */
        function PlotOptionsForm() {

            /*
             Defined below are the form structures for the plot options.
             */
            this.xAxisForm = {
                'name':'x-axis',
                'sections': [{
                    'name': 'x-axis',
                    'rows': [
                        {
                            'name': 'Domain',
                            'control': 'select',
                            'key': 'key',
                            'options': [
                                {'name':'SCET', 'value': 'scet'},
                                {'name':'SCLK', 'value': 'sclk'},
                                {'name':'LST', 'value': 'lst'}
                            ]
                        }
                    ]
            }]};

            this.yAxisForm = {
                'name':'y-axis',
                'sections': [{
                // Will need to be repeated for each y-axis, with a
                // distinct name for each. Ideally the name of the axis
                // itself.
                'name': 'y-axis',
                'rows': [
                    {
                        'name': 'Range',
                        'control': 'select',
                        'key': 'key',
                        'options': [
                            {'name':'EU', 'value': 'eu'},
                            {'name':'DN', 'value': 'dn'},
                            {'name':'Status', 'value': 'status'}
                        ]
                    },
                    {
                        'name': 'Autoscale',
                        'control': 'checkbox',
                        'key': 'autoscale'
                    },
                    {
                        'name': 'Min',
                        'control': 'textfield',
                        'key': 'min',
                        'pattern': '[0-9]',
                        'inputsize' : 'sm'
                    },
                    {
                        'name': 'Max',
                        'control': 'textfield',
                        'key': 'max',
                        'pattern': '[0-9]',
                        'inputsize' : 'sm'
                    }
                ]
                }]
            };
            this.plotSeriesForm = {
                'name':'Series Options',
                'sections': [
                    {
                        rows: [
                        {
                            'name': 'Color',
                            'control': 'color',
                            'key': 'color'
                        }]
                    },
                    {
                        'rows':[
                            {
                                'name': 'Markers',
                                'control': 'checkbox',
                                'key': 'markers',
                                'layout': 'control-first'
                            }
                        ]
                    },
                    {
                        'rows':[
                            {
                                'name': 'No Line',
                                'control': 'radio',
                                'key': 'lineType',
                                'value': 'noLine',
                                'layout': 'control-first'
                            },
                            {
                                'name': 'Step Line',
                                'control': 'radio',
                                'key': 'lineType',
                                'value': 'stepLine',
                                'layout': 'control-first'
                            },
                            {
                                'name': 'Linear Line',
                                'control': 'radio',
                                'key': 'lineType',
                                'value': 'linearLine',
                                'layout': 'control-first'
                            }
                        ]
                    }
                ]
            };
        }

        return PlotOptionsForm;
    }
);

