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
    'legacyRegistry'
], function (
    DialogService,
    OverlayService,
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
                    "templateUrl": "templates/overlay-dialog.html"
                },
                {
                    "key": "overlay-options",
                    "templateUrl": "templates/overlay-options.html"
                },
                {
                    "key": "form-dialog",
                    "templateUrl": "templates/dialog.html"
                },
                {
                    "key": "overlay-blocking-message",
                    "templateUrl": "templates/overlay-blocking-message.html"
                },
                {
                    "key": "message",
                    "templateUrl": "templates/message.html"
                },
                {
                    "key": "overlay-message-list",
                    "templateUrl": "templates/overlay-message-list.html"
                }
            ],
            "containers": [
                {
                    "key": "overlay",
                    "templateUrl": "templates/overlay.html"
                }
            ]
        }
    });
});
