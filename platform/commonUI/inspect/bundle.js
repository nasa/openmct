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
    "./src/gestures/InfoGesture",
    "./src/gestures/InfoButtonGesture",
    "./src/services/InfoService",
    "text!./res/info-table.html",
    "text!./res/info-bubble.html",
    "text!./res/bubble.html",
    "text!./res/templates/info-button.html",
    'legacyRegistry'
], function (
    InfoGesture,
    InfoButtonGesture,
    InfoService,
    infoTableTemplate,
    infoBubbleTemplate,
    bubbleTemplate,
    infoButtonTemplate,
    legacyRegistry
) {
    "use strict";

    legacyRegistry.register("platform/commonUI/inspect", {
        "extensions": {
            "templates": [
                {
                    "key": "info-table",
                    "template": infoTableTemplate
                },
                {
                    "key": "info-bubble",
                    "template": infoBubbleTemplate
                }
            ],
            "containers": [
                {
                    "key": "bubble",
                    "template": bubbleTemplate,
                    "attributes": [
                        "bubbleTitle",
                        "bubbleLayout"
                    ],
                    "alias": "bubble"
                }
            ],
            "gestures": [
                {
                    "key": "info",
                    "implementation": InfoGesture,
                    "depends": [
                        "$timeout",
                        "agentService",
                        "infoService",
                        "INFO_HOVER_DELAY"
                    ]
                },
                {
                    "key": "infobutton",
                    "implementation": InfoButtonGesture,
                    "depends": [
                        "$document",
                        "agentService",
                        "infoService"
                    ]
                }
            ],
            "services": [
                {
                    "key": "infoService",
                    "implementation": InfoService,
                    "depends": [
                        "$compile",
                        "$rootScope",
                        "popupService",
                        "agentService"
                    ]
                }
            ],
            "constants": [
                {
                    "key": "INFO_HOVER_DELAY",
                    "value": 2000
                }
            ],
            "representations": [
                {
                    "key": "info-button",
                    "template": infoButtonTemplate,
                    "gestures": [
                        "infobutton"
                    ]
                }
            ]
        }
    });
});
