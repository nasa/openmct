/*****************************************************************************
 * Open MCT Web, Copyright (c) 2014-2015, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT Web is licensed under the Apache License, Version 2.0 (the
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
 * Open MCT Web includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/
/*global define*/

define([
    "./src/EventListController",
    "./src/directives/MCTDataTable",
    "./src/policies/MessagesViewPolicy",
    "text!./res/templates/messages.html",
    'legacyRegistry'
], function (
    EventListController,
    MCTDataTable,
    MessagesViewPolicy,
    messagesTemplate,
    legacyRegistry
) {
    "use strict";

    legacyRegistry.register("platform/features/events", {
        "name": "Event Messages",
        "description": "List of time-ordered event messages",
        "extensions": {
            "views": [
                {
                    "key": "messages",
                    "name": "Messages",
                    "glyph": "5",
                    "description": "Scrolling list of messages.",
                    "template": messagesTemplate,
                    "needs": [
                        "telemetry"
                    ],
                    "delegation": true
                }
            ],
            "controllers": [
                {
                    "key": "EventListController",
                    "implementation": EventListController,
                    "depends": [
                        "$scope",
                        "telemetryFormatter"
                    ]
                }
            ],
            "directives": [
                {
                    "key": "mctDataTable",
                    "implementation": MCTDataTable,
                    "depends": [
                        "$window"
                    ]
                }
            ],
            "policies": [
                {
                    "category": "view",
                    "implementation": MessagesViewPolicy
                }
            ]
        }
    });
});
