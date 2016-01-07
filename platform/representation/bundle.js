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

define(['legacyRegistry'], function (legacyRegistry) {
    "use strict";
    legacyRegistry.register("platform/representation", {
        "extensions": {
            "directives": [
                {
                    "key": "mctInclude",
                    "implementation": "MCTInclude.js",
                    "depends": [ "templates[]", "templateLinker" ]
                },
                {
                    "key": "mctRepresentation",
                    "implementation": "MCTRepresentation.js",
                    "depends": [ "representations[]", "views[]", "representers[]", "$q", "templateLinker", "$log" ]
                }
            ],
            "gestures": [
                {
                    "key": "drag",
                    "implementation": "gestures/DragGesture.js",
                    "depends": [ "$log", "dndService" ]
                },
                {
                    "key": "drop",
                    "implementation": "gestures/DropGesture.js",
                    "depends": [ "dndService", "$q" ]
                },
                {
                    "key": "menu",
                    "implementation": "gestures/ContextMenuGesture.js",
                    "depends": ["$timeout", "agentService"]
                }
            ],
            "components": [
                {
                    "provides": "gestureService",
                    "type": "provider",
                    "implementation": "gestures/GestureProvider.js",
                    "depends": ["gestures[]"]
                }
            ],
            "representers": [
                {
                    "implementation": "gestures/GestureRepresenter.js",
                    "depends": [ "gestureService" ]
                }
            ],
            "services": [
                {
                    "key": "dndService",
                    "implementation": "services/DndService.js",
                    "depends": [ "$log" ]
                },
                {
                    "key": "templateLinker",
                    "implementation": "TemplateLinker.js",
                    "depends": [ "$templateRequest", "$sce", "$compile", "$log" ],
                    "comment": "For internal use by mct-include and mct-representation."
                }
            ],
            "actions": [
                {
                    "key": "menu",
                    "implementation": "actions/ContextMenuAction.js",
                    "depends": [
                        "$compile",
                        "$document",
                        "$rootScope",
                        "popupService",
                        "agentService"
                    ]
                }
            ],
            "runs": [
                {
                    "priority": "mandatory",
                    "implementation": "TemplatePrefetcher.js",
                    "depends": [
                        "templateLinker",
                        "templates[]",
                        "views[]",
                        "representations[]",
                        "controls[]",
                        "containers[]"
                    ]
                }
            ]
        }
    });
});
