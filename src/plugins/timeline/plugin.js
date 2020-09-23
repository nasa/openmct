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
                let currentTimeStamp = new Date().getTime();
                let templateActivities = {
                    "NIRVSS": [{
                        name: "Neque porro quisquam est qui dolorem ipsum quia dolor sit amet",
                        // name: 'Activity 1 Activity 1 Activity 1 Activity 1 Activity 1 Activity 1 Activity 1 Activity 1 Activity 1 Activity 1 Activity 1 Activity 1 Activity 1 Activity 1 Activity 1 Activity 1',
                        // start: 1597170002854,
                        start: currentTimeStamp,
                        end: currentTimeStamp + 564000,
                        type: 'NIRVSS',
                        color: 'fuchsia',
                        textColor: 'white'
                    },
                    {
                        name: 'Duis aute irure dolor in reprehenderit in ',
                        // name: 'Activity 2 Activity 2 Activity 2 Activity 2 Activity 2 Activity 2 Activity 2 Activity 2 Activity 2 Activity 2 Activity 2 Activity 2 Activity 2 Activity 2 Activity 2 Activity 2',
                        // start: 1597171132854,
                        start: currentTimeStamp + 565000,
                        end: currentTimeStamp + 565000 + 50000,
                        type: 'NIRVSS',
                        color: 'orange',
                        textColor: 'white'
                    },
                    {
                        name: 'Lorem Ipsum',
                        // start: 1597171132854,
                        start: currentTimeStamp + 565000,
                        end: currentTimeStamp + 565000 + 50000,
                        type: 'NIRVSS',
                        color: 'purple',
                        textColor: 'white'
                    }],
                    "ROVER": [
                        {
                            name: 'Sed ut perspiciatis unde omnis iste natus error sit.',
                            // name: 'Activity 3 Activity 3 Activity 3 Activity 3 Activity 3 Activity 3 Activity 3Activity 3 Activity 3 Activity 3 Activity 3 Activity 3 Activity 3 Activity 3 Activity 3',
                            // start: 1597170132854,
                            start: currentTimeStamp + 65000,
                            end: currentTimeStamp + 65000 + 535000,
                            type: 'VIPER',
                            color: 'white',
                            textColor: 'black'
                        },
                        {
                            name: 'At vero eos et accusamus et ',
                            // name: 'Activity 4 Activity 4 Activity 4 Activity 4 Activity 4 Activity 4 Activity 4 Activity 4 Activity 4 Activity 4 Activity 4 Activity 4 Activity 4 Activity 4 Activity 4',
                            // start: 1597170132854,
                            start: currentTimeStamp + 65000,
                            end: currentTimeStamp + 65000 + 535000,
                            type: 'VIPER',
                            color: 'blue',
                            textColor: 'white'
                        },
                        {
                            name: 'Temporibus autem quibusdam.',
                            // name: 'Activity 5 Activity 5 Activity 5 Activity 5 Activity 5 Activity 5 Activity 5 Activity 5 Activity 5 Activity 5 Activity 5 Activity 5 Activity 5 Activity 5 Activity 5 ',
                            // start: 1597170132854,
                            start: currentTimeStamp + 65000,
                            end: currentTimeStamp + 65000 + 535000,
                            type: 'VIPER',
                            color: 'red',
                            textColor: 'white'
                        }
                    ]
                };
                // let activities = [];
                // for (let i = 0; i < 1; i++) {
                //     activities = activities.concat(templateActivities.map(activity => activity));
                // }

                domainObject.configuration = {
                    name: 'Demo Plan',
                    swimlanes: 10,
                    activities: templateActivities
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

