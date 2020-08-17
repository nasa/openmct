/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2020, United States Government
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

import TimelineViewProvider from './TimelineViewProvider';

export default function () {
    return function install(openmct) {
        openmct.types.addType('plan', {
            name: 'Plan',
            key: 'plan',
            description: 'An activity timeline',
            creatable: true,
            cssClass: 'icon-clock',
            initialize: function (domainObject) {
                domainObject.configuration = {
                    name: 'Demo Plan',
                    swimlanes: 10,
                    activities: [
                        {
                            name: 'Activity 1 Activity 1 Activity 1 Activity 1 Activity 1 Activity 1 Activity 1 Activity 1 Activity 1 Activity 1 Activity 1 Activity 1 Activity 1 Activity 1 Activity 1 Activity 1',
                            start: 1597170002854,
                            end: 1597171032854,
                            type: 'NIRVSS',
                            color: 'fuchsia',
                            textColor: 'black'
                        },
                        {
                            name: 'Activity 2',
                            start: 1597171132854,
                            end: 1597171232854,
                            type: 'NIRVSS',
                            color: 'fuchsia',
                            textColor: 'black'
                        },
                        {
                            name: 'Activity 3 Activity 3 Activity 3 Activity 3 Activity 3 Activity 3 Activity 3Activity 3 Activity 3 Activity 3 Activity 3 Activity 3 Activity 3 Activity 3 Activity 3',
                            start: 1597170132854,
                            end: 1597171202854,
                            type: 'VIPER',
                            color: 'fuchsia',
                            textColor: 'black'
                        },
                        {
                            name: 'Activity 4',
                            start: 1597171132854,
                            end: 1597171232854,
                            type: 'NIRVSS',
                            color: 'fuchsia',
                            textColor: 'black'
                        }]
                    //TODO: these will come later
                    // groups: [],
                    // bounds: {
                    //     start: '',
                    //     end: ''
                    // },
                };
            }
        });
        openmct.objectViews.addProvider(new TimelineViewProvider(openmct));
    };
}

