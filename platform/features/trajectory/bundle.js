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
    "./src/TrajectoryController",
    "text!./res/templates/layout.html",
    'legacyRegistry',
], function (
    TrajectoryController,
    layoutTemplate,
    legacyRegistry
) {
    legacyRegistry.register("platform/features/trajectory", {
        "name": "Trajectory components.",
        "description": "Plugin adding Trajectory capabilities.",
        "extensions": {
            "views": [
                {
                    "key": "trajectory",
                    "name": "Display Trajectory",
                    "cssClass": "icon-image",
                    "type": "trajectory",
                    "template": layoutTemplate,
                    "editable": true,
                    "uses": [],
                },

            ],
            "controllers": [
                {
                    "key": "TrajectoryController",
                    "implementation": TrajectoryController,
                    "depends": [
                        "$scope",
                    ],
                },
                
            ],
            "types": [
                {
                    "key": "trajectory",
                    "name": "Display Trajectory",
                    "cssClass": "icon-image",
                    "description": "Assemble other objects and components together into a reusable screen layout. Working in a simple canvas workspace, simply drag in the objects you want, position and size them. Save your design and view or edit it at any time.",
                    "priority": 900,
                    "features": "creation",
                    "model": {
                        "composition": []
                    },
                },
                
            ]
        }
    });
});
