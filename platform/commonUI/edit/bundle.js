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
    "./src/controllers/EditActionController",
    "./src/controllers/EditPanesController",
    "./src/controllers/ElementsController",
    "./src/controllers/EditObjectController",
    "./src/directives/MCTBeforeUnload",
    "./src/actions/LinkAction",
    "./src/actions/EditAction",
    "./src/actions/PropertiesAction",
    "./src/actions/RemoveAction",
    "./src/actions/SaveAction",
    "./src/actions/SaveAsAction",
    "./src/actions/CancelAction",
    "./src/policies/EditActionPolicy",
    "./src/policies/EditableLinkPolicy",
    "./src/policies/EditableMovePolicy",
    "./src/policies/EditNavigationPolicy",
    "./src/policies/EditContextualActionPolicy",
    "./src/representers/EditRepresenter",
    "./src/representers/EditToolbarRepresenter",
    "text!./res/templates/library.html",
    "text!./res/templates/edit-object.html",
    "text!./res/templates/edit-action-buttons.html",
    "text!./res/templates/elements.html",
    "text!./res/templates/topbar-edit.html",
    'legacyRegistry'
], function (
    EditActionController,
    EditPanesController,
    ElementsController,
    EditObjectController,
    MCTBeforeUnload,
    LinkAction,
    EditAction,
    PropertiesAction,
    RemoveAction,
    SaveAction,
    SaveAsAction,
    CancelAction,
    EditActionPolicy,
    EditableLinkPolicy,
    EditableMovePolicy,
    EditNavigationPolicy,
    EditContextualActionPolicy,
    EditRepresenter,
    EditToolbarRepresenter,
    libraryTemplate,
    editObjectTemplate,
    editActionButtonsTemplate,
    elementsTemplate,
    topbarEditTemplate,
    legacyRegistry
) {
    "use strict";

    legacyRegistry.register("platform/commonUI/edit", {
        "extensions": {
            "controllers": [
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
                },
                {
                    "key": "EditObjectController",
                    "implementation": EditObjectController,
                    "depends": [
                        "$scope",
                        "$location",
                        "policyService"
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
                    "depends": [],
                    "priority": "mandatory"
                },
                {
                    "key": "save",
                    "category": "conclude-editing",
                    "implementation": SaveAsAction,
                    "name": "Save",
                    "description": "Save changes made to these objects.",
                    "depends": [
                        "$injector",
                        "policyService",
                        "dialogService",
                        "creationService",
                        "copyService"
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
                },
                {
                    "category": "action",
                    "implementation": EditContextualActionPolicy,
                    "depends": ["navigationService", "editModeBlacklist", "nonEditContextBlacklist"]
                },
                {
                    "category": "action",
                    "implementation": EditableMovePolicy
                },
                {
                    "category": "action",
                    "implementation": EditableLinkPolicy
                },
                {
                    "category": "navigation",
                    "message": "There are unsaved changes.",
                    "implementation": EditNavigationPolicy
                }

            ],
            "templates": [
                {
                    "key": "edit-library",
                    "template": libraryTemplate
                }
            ],
            "representations": [
                {
                    "key": "edit-object",
                    "template": editObjectTemplate,
                    "uses": [
                        "view"
                    ],
                    "gestures": [
                        "drop"
                    ]
                },
                {
                    "key": "edit-action-buttons",
                    "template": editActionButtonsTemplate,
                    "uses": [
                        "action"
                    ]
                },
                {
                    "key": "edit-elements",
                    "template": elementsTemplate,
                    "uses": [
                        "composition"
                    ],
                    "gestures": [
                        "drop"
                    ]
                },
                {
                    "key": "topbar-edit",
                    "template": topbarEditTemplate
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
            ],
            "constants": [
                {
                    "key":"editModeBlacklist",
                    "value": ["copy", "follow", "window", "link", "locate"]
                },
                {
                    "key": "nonEditContextBlacklist",
                    "value": ["copy", "follow", "properties", "move", "link", "remove", "locate"]
                }
            ]
        }
    });
});
