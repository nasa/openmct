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
        function PlotOptionsForm(topic) {
            var self = this;
            this.onchangeTopic = topic();

            function onchange(value){
                self.onchangeTopic.notify(value);
            }

            /*
             Defined below are the form structures for the plot options.
             */
            this.xAxisForm = {
                'name':'x-axis',
                'onchange': onchange,
                'sections': [{
                    'name': 'x-axis',
                    'rows': [
                        {
                            'name': 'Domain',
                            'control': 'select',
                            'key': 'key',
                            'options': [
                                {'name':'scet', 'value': 'scet'},
                                {'name':'sclk', 'value': 'sclk'},
                                {'name':'lst', 'value': 'lst'}
                            ]
                        }
                    ]
            }]};

            this.yAxisForm = {
                'name':'y-axis',
                'onchange': onchange,
                'sections': [{
                // Will need to be repeated for each y-axis, with a
                // distinct name for each. Ideally the name of the axis
                // itself.
                'name': 'y-axis',
                'rows': [
                    {
                        'name': 'Autoscale',
                        'control': 'checkbox',
                        'key': 'autoscale'
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
                        'key': 'max',
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
            };
            this.plotSeriesForm = {
                'name':'Series Options',
                'onchange': onchange,
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
                                'key': 'markers'
                            }
                        ]
                    },
                    {
                        'rows':[
                            {
                                'name': 'No Line',
                                'control': 'radio',
                                'key': 'lineType',
                                'value': 'noLine'
                            },
                            {
                                'name': 'Step Line',
                                'control': 'radio',
                                'key': 'lineType',
                                'value': 'stepLine'
                            },
                            {
                                'name': 'Linear Line',
                                'control': 'radio',
                                'key': 'lineType',
                                'value': 'linearLine'
                            }
                        ]
                    }
                ]
            };
        }

        PlotOptionsForm.prototype.listen = function (callback){
            return this.onchangeTopic.listen(callback);
        };

        return PlotOptionsForm;
    }
);

