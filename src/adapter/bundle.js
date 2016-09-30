/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2016, United States Government
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

define([
    'legacyRegistry',
    './actions/ActionDialogDecorator',
    './directives/MCTView',
    './services/Instantiate',
    './capabilities/APICapabilityDecorator',
    './policies/AdapterCompositionPolicy'
], function (
    legacyRegistry,
    ActionDialogDecorator,
    MCTView,
    Instantiate,
    APICapabilityDecorator,
    AdapterCompositionPolicy
) {
    legacyRegistry.register('src/adapter', {
        "extensions": {
            "directives": [
                {
                    key: "mctView",
                    implementation: MCTView,
                    depends: [
                        "newViews[]",
                        "mct"
                    ]
                }
            ],
            services: [
                {
                    key: "instantiate",
                    priority: "mandatory",
                    implementation: Instantiate,
                    depends: [
                        "capabilityService",
                        "identifierService",
                        "cacheService"
                    ]
                }
            ],
            components: [
                {
                    type: "decorator",
                    provides: "capabilityService",
                    implementation: APICapabilityDecorator,
                    depends: [
                        "$injector"
                    ]
                },
                {
                    type: "decorator",
                    provides: "actionService",
                    implementation: ActionDialogDecorator,
                    depends: [ "mct", "newViews[]" ]
                }
            ],
            policies: [
                {
                    category: "composition",
                    implementation: AdapterCompositionPolicy,
                    depends: [ "mct" ]
                }
            ]
        }
    });
});
