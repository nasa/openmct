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

define([
    "./src/controllers/EditActionController",
    "./src/controllers/EditPanesController",
    "./src/controllers/ElementsController",
    "./src/controllers/EditObjectController",
    "./src/directives/MCTBeforeUnload",
    "./src/actions/EditAndComposeAction",
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
    "./src/capabilities/EditorCapability",
    "./src/capabilities/TransactionCapabilityDecorator",
    "./src/services/TransactionService",
    "./src/creation/CreateMenuController",
    "./src/creation/LocatorController",
    "./src/creation/CreationPolicy",
    "./src/creation/CreateActionProvider",
    "./src/creation/AddActionProvider",
    "./src/creation/CreationService",
    "text!./res/templates/create/locator.html",
    "text!./res/templates/create/create-button.html",
    "text!./res/templates/create/create-menu.html",
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
    EditAndComposeAction,
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
    EditorCapability,
    TransactionCapabilityDecorator,
    TransactionService,
    CreateMenuController,
    LocatorController,
    CreationPolicy,
    CreateActionProvider,
    AddActionProvider,
    CreationService,
    locatorTemplate,
    createButtonTemplate,
    createMenuTemplate,
    libraryTemplate,
    editObjectTemplate,
    editActionButtonsTemplate,
    elementsTemplate,
    topbarEditTemplate,
    legacyRegistry
) {

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
                },
                {
                    "key": "CreateMenuController",
                    "implementation": CreateMenuController,
                    "depends": [
                        "$scope"
                    ]
                },
                {
                    "key": "LocatorController",
                    "implementation": LocatorController,
                    "depends": [
                        "$scope",
                        "$timeout",
                        "objectService"
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
                    "implementation": EditAndComposeAction
                },
                {
                    "key": "edit",
                    "implementation": EditAction,
                    "depends": [
                        "$location",
                        "navigationService",
                        "$log"
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
                    "depends": []
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
                    "message": "Continuing will cause the loss of any unsaved changes.",
                    "implementation": EditNavigationPolicy
                },
                {
                    "implementation": CreationPolicy,
                    "category": "creation"
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
                },
                {
                    "key": "create-button",
                    "template": createButtonTemplate
                },
                {
                    "key": "create-menu",
                    "template": createMenuTemplate,
                    "uses": [
                        "action"
                    ]
                }
            ],
            "components": [
                {
                    "type": "decorator",
                    "provides": "capabilityService",
                    "implementation": TransactionCapabilityDecorator,
                    "depends": [
                        "$q",
                        "transactionService"
                    ],
                    "priority": "fallback"
                },
                {
                    "type": "provider",
                    "provides": "transactionService",
                    "implementation": TransactionService,
                    "depends": [
                        "$q",
                        "$log"
                    ]
                },
                {
                    "key": "CreateActionProvider",
                    "provides": "actionService",
                    "type": "provider",
                    "implementation": CreateActionProvider,
                    "depends": [
                        "typeService",
                        "policyService"
                    ]
                },
                {
                    "key": "AddActionProvider",
                    "provides": "actionService",
                    "type": "provider",
                    "implementation": AddActionProvider,
                    "depends": [
                        "$q",
                        "typeService",
                        "dialogService",
                        "policyService"
                    ]
                },
                {
                    "key": "CreationService",
                    "provides": "creationService",
                    "type": "provider",
                    "implementation": CreationService,
                    "depends": [
                        "$q",
                        "$log"
                    ]
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
                    "key": "editModeBlacklist",
                    "value": ["copy", "follow", "window", "link", "locate"]
                },
                {
                    "key": "nonEditContextBlacklist",
                    "value": ["copy", "follow", "properties", "move", "link", "remove", "locate"]
                }
            ],
            "capabilities": [
                {
                    "key": "editor",
                    "name": "Editor Capability",
                    "description": "Provides transactional editing capabilities",
                    "implementation": EditorCapability,
                    "depends": [
                        "transactionService"
                    ]
                }
            ],
            "controls": [
                {
                    "key": "locator",
                    "template": locatorTemplate
                }
            ]
        }
    });
});
