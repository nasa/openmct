/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2017, United States Government
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
    './RoverPropertiesAction',
    './RoverPropertiesActionPolicy'
    ], function (
        RoverPropertiesAction,
        RoverPropertiesActionPolicy
    ) {
    return function () {
        return function (openmct) {
            openmct.legacyExtension('actions', {
                "key": "rover-properties",
                "category": [
                    "contextual",
                    "view-control"
                ],
                "implementation": RoverPropertiesAction,
                "cssClass": "major icon-pencil",
                "name": "Edit Properties...",
                "description": "Edit properties of this object.",
                "depends": [
                    "dialogService"
                ]
            });

            openmct.legacyExtension('policies', {
                "category": "action",
                "implementation": RoverPropertiesActionPolicy
            });

            // Dummy rover view type for testing
/*            openmct.types.addType('webgl.rover.view', {
                key: 'webgl.rover.view',
                name: 'Rover View',
                cssClass: 'icon-image',
                description: 'For development use.',
                creatable: true,
                initialize: function (object) {
                    object.configuration = {
                        telemetry: {
                            'joint1': 'value1',
                            'joint2': 'value2'
                        }
                    }
                }
            });*/
        };
    };
});
