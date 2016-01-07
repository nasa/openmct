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
    legacyRegistry.register("platform/commonUI/edit", {
        "extensions": {
            "routes": [
                {
                    "when": "/edit",
                    "templateUrl": "templates/edit.html"
                }
            ],
            "controllers": [
                {
                    "key": "EditController",
                    "implementation": "controllers/EditController.js",
                    "depends": [ "$scope", "$q", "navigationService" ]
                },
                {
                    "key": "EditActionController",
                    "implementation": "controllers/EditActionController.js",
                    "depends": [ "$scope" ]
                },
                {
                    "key": "EditPanesController",
                    "implementation": "controllers/EditPanesController.js",
                    "depends": [ "$scope" ]
                }
            ],
            "directives": [
                {
                    "key": "mctBeforeUnload",
                    "implementation": "directives/MCTBeforeUnload.js",
                    "depends": [ "$window" ]
                }
            ],
            "actions": [
                {
                    "key": "compose",
                    "implementation": "actions/LinkAction.js"
                },
                {
                    "key": "edit",
                    "implementation": "actions/EditAction.js",
                    "depends": [ "$location", "navigationService", "$log" ],
                    "description": "Edit this object.",
                    "category": "view-control",
                    "glyph": "p"
                },
                {
                    "key": "properties",
                    "category": ["contextual", "view-control"],
                    "implementation": "actions/PropertiesAction.js",
                    "glyph": "p",
                    "name": "Edit Properties...",
                    "description": "Edit properties of this object.",
                    "depends": [ "dialogService" ]
                },
                {
                    "key": "remove",
                    "category": "contextual",
                    "implementation": "actions/RemoveAction.js",
                    "glyph": "Z",
                    "name": "Remove",
                    "description": "Remove this object from its containing object.",
                    "depends": [ "$q", "navigationService" ]
                },
                {
                    "key": "save",
                    "category": "conclude-editing",
                    "implementation": "actions/SaveAction.js",
                    "name": "Save",
                    "description": "Save changes made to these objects.",
                    "depends": [ "$location", "urlService" ],
                    "priority": "mandatory"
                },
                {
                    "key": "cancel",
                    "category": "conclude-editing",
                    "implementation": "actions/CancelAction.js",
                    "name": "Cancel",
                    "description": "Discard changes made to these objects.",
                    "depends": [ "$location", "urlService" ]
                }
            ],
            "policies": [
                {
                    "category": "action",
                    "implementation": "policies/EditActionPolicy.js"
                },
                {
                    "category": "view",
                    "implementation": "policies/EditableViewPolicy.js"
                }
            ],
            "templates": [
                {
                    "key": "edit-library",
                    "templateUrl": "templates/library.html"
                }
            ],
            "representations": [
                {
                    "key": "edit-object",
                    "templateUrl": "templates/edit-object.html",
                    "uses": [ "view" ]
                },
                {
                    "key": "edit-action-buttons",
                    "templateUrl": "templates/edit-action-buttons.html",
                    "uses": [ "action" ]
                },
                {
                    "key": "edit-elements",
                    "templateUrl": "templates/elements.html",
                    "uses": [ "composition" ],
                    "gestures": [ "drop" ]
                },
                {
                    "key": "topbar-edit",
                    "templateUrl": "templates/topbar-edit.html"
                }
            ],     
            "representers": [
                {
                    "implementation": "representers/EditRepresenter.js",
                    "depends": [ "$q", "$log" ]
                },
                {
                    "implementation": "representers/EditToolbarRepresenter.js"
                }
            ]
        }
    });
});
