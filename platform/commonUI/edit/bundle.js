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
    "./src/controllers/EditController",
    "./src/controllers/EditActionController",
    "./src/controllers/EditPanesController",
    "./src/controllers/ElementsController",
    "./src/directives/MCTBeforeUnload",
    "./src/actions/LinkAction",
    "./src/actions/EditAction",
    "./src/actions/PropertiesAction",
    "./src/actions/RemoveAction",
    "./src/actions/SaveAction",
    "./src/actions/CancelAction",
    "./src/policies/EditActionPolicy",
    "./src/representers/EditRepresenter",
    "./src/representers/EditToolbarRepresenter",
    'legacyRegistry'
], function (
    EditController,
    EditActionController,
    EditPanesController,
    ElementsController,
    MCTBeforeUnload,
    LinkAction,
    EditAction,
    PropertiesAction,
    RemoveAction,
    SaveAction,
    CancelAction,
    EditActionPolicy,
    EditRepresenter,
    EditToolbarRepresenter,
    legacyRegistry
) {
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
                    "implementation": EditController,
                    "depends": [
                        "$scope",
                        "$q",
                        "navigationService"
                    ]
                },
                {
                    "key": "EditActionController",
                    "implementation": EditActionController,
                    "depends": [
                        "$scope"
                    ]
                },
                {
                    "key": "EditPanesController",
                    "implementation": EditPanesController,
                    "depends": [
                        "$scope"
                    ]
                },
                {
                    "key": "ElementsController",
                    "implementation": ElementsController,
                    "depends": [
                        "$scope"
                    ]
                }
            ],
            "directives": [
                {
                    "key": "mctBeforeUnload",
                    "implementation": MCTBeforeUnload,
                    "depends": [
                        "$window"
                    ]
                }
            ],
            "actions": [
                {
                    "key": "compose",
                    "implementation": LinkAction
                },
                {
                    "key": "edit",
                    "implementation": EditAction,
                    "depends": [
                        "$location",
                        "navigationService",
                        "$log",
                        "$q"
                    ],
                    "description": "Edit this object.",
                    "category": "view-control",
                    "glyph": "p"
                },
                {
                    "key": "properties",
                    "category": [
                        "contextual",
                        "view-control"
                    ],
                    "implementation": PropertiesAction,
                    "glyph": "p",
                    "name": "Edit Properties...",
                    "description": "Edit properties of this object.",
                    "depends": [
                        "dialogService"
                    ]
                },
                {
                    "key": "remove",
                    "category": "contextual",
                    "implementation": RemoveAction,
                    "glyph": "Z",
                    "name": "Remove",
                    "description": "Remove this object from its containing object.",
                    "depends": [
                        "$q",
                        "navigationService"
                    ]
                },
                {
                    "key": "save",
                    "category": "conclude-editing",
                    "implementation": SaveAction,
                    "name": "Save",
                    "description": "Save changes made to these objects.",
                    "depends": [
                        "$q",
                        "$location",
                        "$injector",
                        "urlService",
                        "navigationService",
                        "policyService",
                        "dialogService",
                        "creationService"
                    ],
                    "priority": "mandatory"
                },
                {
                    "key": "cancel",
                    "category": "conclude-editing",
                    "implementation": CancelAction,
                    "name": "Cancel",
                    "description": "Discard changes made to these objects.",
                    "depends": [
                        "$injector",
                        "navigationService"
                    ]
                }
            ],
            "policies": [
                {
                    "category": "action",
                    "implementation": EditActionPolicy
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
                    "uses": [
                        "view"
                    ]
                },
                {
                    "key": "edit-action-buttons",
                    "templateUrl": "templates/edit-action-buttons.html",
                    "uses": [
                        "action"
                    ]
                },
                {
                    "key": "edit-elements",
                    "templateUrl": "templates/elements.html",
                    "uses": [
                        "composition"
                    ],
                    "gestures": [
                        "drop"
                    ]
                },
                {
                    "key": "topbar-edit",
                    "templateUrl": "templates/topbar-edit.html"
                }
            ],
            "representers": [
                {
                    "implementation": EditRepresenter,
                    "depends": [
                        "$q",
                        "$log"
                    ]
                },
                {
                    "implementation": EditToolbarRepresenter
                }
            ]
        }
    });
});
