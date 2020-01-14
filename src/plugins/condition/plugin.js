/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2019, United States Government
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
import ConditionSetViewProvider from './ConditionSetViewProvider.js';
import ConditionSetCompositionPolicy from "@/plugins/condition/ConditionSetCompositionPolicy";

export default function ConditionPlugin() {

    return function install(openmct) {
        openmct.types.addType('condition', {
            name: 'Condition',
            key: 'condition',
            description: 'A list of criteria which will be evaluated based on a trigger',
            creatable: false,
            initialize: function (domainObject) {
                domainObject.composition = [];
            }
        });

        openmct.types.addType('conditionSet', {
            name: 'Condition Set',
            key: 'conditionSet',
            description: 'A set of one or more conditions based on user-specified criteria.',
            creatable: true,
            cssClass: 'icon-summary-widget',  // TODO: replace with class for new icon
            initialize: function (domainObject) {
                domainObject.configuration = {
                    conditionCollection: []
                };
                domainObject.composition = [];
            }
        });

        openmct.composition.addPolicy(new ConditionSetCompositionPolicy(openmct).allow);

        openmct.objectViews.addProvider(new ConditionSetViewProvider(openmct));

    }
}
