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
                domainObject.configuration = {
                    name: 'Demo Plan',
                    swimlanes: 10,
                    activities: [
                        {
                            name: "Neque porro quisquam est qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit Neque porro quisquam est qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit",
                            // name: 'Activity 1 Activity 1 Activity 1 Activity 1 Activity 1 Activity 1 Activity 1 Activity 1 Activity 1 Activity 1 Activity 1 Activity 1 Activity 1 Activity 1 Activity 1 Activity 1',
                            // start: 1597170002854,
                            start: currentTimeStamp,
                            end: currentTimeStamp + 564000,
                            type: 'NIRVSS',
                            color: 'fuchsia',
                            textColor: 'white'
                        },
                        {
                            name: 'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur Excepteur sint occaecat cupidatat non proident',
                            // name: 'Activity 2 Activity 2 Activity 2 Activity 2 Activity 2 Activity 2 Activity 2 Activity 2 Activity 2 Activity 2 Activity 2 Activity 2 Activity 2 Activity 2 Activity 2 Activity 2',
                            // start: 1597171132854,
                            start: currentTimeStamp + 565000,
                            end: currentTimeStamp + 565000 + 50000,
                            type: 'NIRVSS',
                            color: 'orange',
                            textColor: 'white'
                        },
                        {
                            name: 'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.',
                            // name: 'Activity 3 Activity 3 Activity 3 Activity 3 Activity 3 Activity 3 Activity 3Activity 3 Activity 3 Activity 3 Activity 3 Activity 3 Activity 3 Activity 3 Activity 3',
                            // start: 1597170132854,
                            start: currentTimeStamp + 65000,
                            end: currentTimeStamp + 65000 + 535000,
                            type: 'VIPER',
                            color: 'white',
                            textColor: 'black'
                        },
                        {
                            name: 'At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident',
                            // name: 'Activity 4 Activity 4 Activity 4 Activity 4 Activity 4 Activity 4 Activity 4 Activity 4 Activity 4 Activity 4 Activity 4 Activity 4 Activity 4 Activity 4 Activity 4',
                            // start: 1597170132854,
                            start: currentTimeStamp + 65000,
                            end: currentTimeStamp + 65000 + 535000,
                            type: 'VIPER',
                            color: 'blue',
                            textColor: 'white'
                        },
                        {
                            name: 'Temporibus autem quibusdam et aut officiis debitis aut rerum necessitatibus saepe eveniet ut et voluptates repudiandae sint et molestiae non recusandae.',
                            // name: 'Activity 5 Activity 5 Activity 5 Activity 5 Activity 5 Activity 5 Activity 5 Activity 5 Activity 5 Activity 5 Activity 5 Activity 5 Activity 5 Activity 5 Activity 5 ',
                            // start: 1597170132854,
                            start: currentTimeStamp + 65000,
                            end: currentTimeStamp + 65000 + 535000,
                            type: 'VIPER',
                            color: 'red',
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

