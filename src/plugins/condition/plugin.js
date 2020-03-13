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
import ConditionSetViewProvider from './ConditionSetViewProvider.js';
import ConditionSetCompositionPolicy from "./ConditionSetCompositionPolicy";
import ConditionSetMetadataProvider from './ConditionSetMetadataProvider';
import ConditionSetTelemetryProvider from './ConditionSetTelemetryProvider';
import uuid from "uuid";

export default function ConditionPlugin() {

    return function install(openmct) {

        openmct.types.addType('conditionSet', {
            name: 'Condition Set',
            key: 'conditionSet',
            description: 'A set of one or more conditions based on user-specified criteria.',
            creatable: true,
            cssClass: 'icon-conditional',  // TODO: replace with class for new icon
            initialize: function (domainObject) {
                domainObject.configuration = {
                    conditionCollection: [{
                        isDefault: true,
                        id: uuid(),
                        configuration: {
                            name: 'Default',
                            output: 'false',
                            trigger: 'all',
                            criteria: []
                        },
                        summary: 'Default condition'
                    }]
                };
                domainObject.composition = [];
                domainObject.telemetry = {};
            }
        });

        openmct.composition.addPolicy(new ConditionSetCompositionPolicy(openmct).allow);
        openmct.telemetry.addProvider(new ConditionSetMetadataProvider(openmct));
        openmct.telemetry.addProvider(new ConditionSetTelemetryProvider(openmct));
        openmct.objectViews.addProvider(new ConditionSetViewProvider(openmct));

    }
}
