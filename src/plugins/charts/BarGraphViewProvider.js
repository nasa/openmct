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

import BarGraphView from './BarGraphView.vue';
import { BAR_GRAPH_KEY, BAR_GRAPH_VIEW } from './BarGraphConstants';
import Vue from 'vue';

export default function BarGraphViewProvider(openmct) {
    function isCompactView(objectPath) {
        return objectPath.find(object => object.type === 'time-strip');
    }

    return {
        key: BAR_GRAPH_VIEW,
        name: 'Bar Graph',
        cssClass: 'icon-telemetry',
        canView(domainObject, objectPath) {
            return domainObject && domainObject.type === BAR_GRAPH_KEY;
        },

        canEdit(domainObject, objectPath) {
            return domainObject && domainObject.type === BAR_GRAPH_KEY;
        },

        view: function (domainObject, objectPath) {
            let component;

            return {
                show: function (element) {
                    let isCompact = isCompactView(objectPath);
                    component = new Vue({
                        el: element,
                        components: {
                            BarGraphView
                        },
                        provide: {
                            openmct,
                            domainObject,
                            path: objectPath
                        },
                        data() {
                            return {
                                options: {
                                    compact: isCompact
                                }
                            };
                        },
                        template: '<bar-graph-view :options="options"></bar-graph-view>'
                    });
                },
                destroy: function () {
                    component.$destroy();
                    component = undefined;
                }
            };
        }
    };
}
