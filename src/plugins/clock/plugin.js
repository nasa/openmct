
/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2021, United States Government
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

import ClockViewProvider from './ClockViewProvider';

export default function () {
    return function install(openmct) {
        openmct.types.addType('Clock', {
            key: 'clock',
            name: 'Clock',
            description: 'A UTC-based clock that supports a variety of display formats. Clocks can be added to Display Layouts.',
            creatable: true,
            cssClass: 'icon-clock',
            "priority": 101,
            initialize: function (domainObject) {
                domainObject.clockFormat = [
                    'YYYY/MM/DD hh:mm:ss',
                    'clock12'
                ];
                domainObject.timezone = 'UTC';
                domainObject.configuration = {
                    baseFormat: 'YYYY/MM/DD hh:mm:ss',
                    use24: 'clock12'
                };
            },
            "form": [
                {
                    key: 'clockFormat',
                    name: 'Display Format',
                    control: 'composite',
                    items: [
                        {
                            control: 'select',
                            options: [
                                {
                                    value: 'YYYY/MM/DD hh:mm:ss',
                                    name: 'YYYY/MM/DD hh:mm:ss'
                                },
                                {
                                    value: 'YYYY/DDD hh:mm:ss',
                                    name: 'YYYY/DDD hh:mm:ss'
                                },
                                {
                                    value: 'hh:mm:ss',
                                    name: 'hh:mm:ss'
                                }
                            ],
                            cssClass: 'l-inline',
                            property: [
                                'configuration',
                                'baseFormat'
                            ]
                        },
                        {
                            control: 'select',
                            options: [
                                {
                                    value: 'clock12',
                                    name: '12hr'
                                },
                                {
                                    value: 'clock24',
                                    name: '24hr'
                                }
                            ],
                            cssClass: 'l-inline',
                            property: [
                                'configuration',
                                'use24'
                            ]
                        }
                    ]
                }
            ]
        });
        openmct.objectViews.addProvider(new ClockViewProvider(openmct));
    };
}
