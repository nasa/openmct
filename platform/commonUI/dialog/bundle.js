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
    "./src/DialogService",
    "./src/OverlayService",
    "text!./res/templates/overlay-dialog.html",
    "text!./res/templates/overlay-options.html",
    "text!./res/templates/dialog.html",
    "text!./res/templates/overlay-blocking-message.html",
    "text!./res/templates/message.html",
    "text!./res/templates/overlay-message-list.html",
    "text!./res/templates/overlay.html",
    'legacyRegistry'
], function (
    DialogService,
    OverlayService,
    overlayDialogTemplate,
    overlayOptionsTemplate,
    dialogTemplate,
    overlayBlockingMessageTemplate,
    messageTemplate,
    overlayMessageListTemplate,
    overlayTemplate,
    legacyRegistry
) {
    "use strict";

    legacyRegistry.register("platform/commonUI/dialog", {
        "extensions": {
            "services": [
                {
                    "key": "dialogService",
                    "implementation": DialogService,
                    "depends": [
                        "overlayService",
                        "$q",
                        "$log"
                    ]
                },
                {
                    "key": "overlayService",
                    "implementation": OverlayService,
                    "depends": [
                        "$document",
                        "$compile",
                        "$rootScope"
                    ]
                }
            ],
            "templates": [
                {
                    "key": "overlay-dialog",
                    "template": overlayDialogTemplate
                },
                {
                    "key": "overlay-options",
                    "template": overlayOptionsTemplate
                },
                {
                    "key": "form-dialog",
                    "template": dialogTemplate
                },
                {
                    "key": "overlay-blocking-message",
                    "template": overlayBlockingMessageTemplate
                },
                {
                    "key": "message",
                    "template": messageTemplate
                },
                {
                    "key": "overlay-message-list",
                    "template": overlayMessageListTemplate
                }
            ],
            "containers": [
                {
                    "key": "overlay",
                    "template": overlayTemplate
                }
            ]
        }
    });
});
