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
    "./src/BrowseController",
    "./src/PaneController",
    "./src/BrowseObjectController",
    "./src/creation/CreateMenuController",
    "./src/creation/LocatorController",
    "./src/MenuArrowController",
    "./src/navigation/NavigationService",
    "./src/creation/CreationPolicy",
    "./src/navigation/NavigateAction",
    "./src/windowing/NewTabAction",
    "./src/windowing/FullscreenAction",
    "./src/creation/CreateActionProvider",
    "./src/creation/AddActionProvider",
    "./src/creation/CreationService",
    "./src/windowing/WindowTitler",
    "text!./res/templates/browse.html",
    "text!./res/templates/create/locator.html",
    "text!./res/templates/browse-object.html",
    "text!./res/templates/create/create-button.html",
    "text!./res/templates/create/create-menu.html",
    "text!./res/templates/items/grid-item.html",
    "text!./res/templates/browse/object-header.html",
    "text!./res/templates/menu-arrow.html",
    "text!./res/templates/back-arrow.html",
    "text!./res/templates/items/items.html",
    "text!./res/templates/browse/object-properties.html",
    "text!./res/templates/browse/inspector-region.html",
    'legacyRegistry'
], function (
    BrowseController,
    PaneController,
    BrowseObjectController,
    CreateMenuController,
    LocatorController,
    MenuArrowController,
    NavigationService,
    CreationPolicy,
    NavigateAction,
    NewTabAction,
    FullscreenAction,
    CreateActionProvider,
    AddActionProvider,
    CreationService,
    WindowTitler,
    browseTemplate,
    locatorTemplate,
    browseObjectTemplate,
    createButtonTemplate,
    createMenuTemplate,
    gridItemTemplate,
    objectHeaderTemplate,
    menuArrowTemplate,
    backArrowTemplate,
    itemsTemplate,
    objectPropertiesTemplate,
    inspectorRegionTemplate,
    legacyRegistry
) {
    "use strict";

    legacyRegistry.register("platform/commonUI/browse", {
        "extensions": {
            "routes": [
                {
                    "when": "/browse/:ids*",
                    "template": browseTemplate,
                    "reloadOnSearch": false
                },
                {
                    "when": "",
                    "template": browseTemplate,
                    "reloadOnSearch": false
                }
            ],
            "constants": [
                {
                    "key": "DEFAULT_PATH",
                    "value": "mine",
                    "priority": "fallback"
                }
            ],
            "controllers": [
                {
                    "key": "BrowseController",
                    "implementation": BrowseController,
                    "depends": [
                        "$scope",
                        "$route",
                        "$location",
                        "$window",
                        "objectService",
                        "navigationService",
                        "urlService",
                        "policyService",
                        "DEFAULT_PATH"
                    ]
                },
                {
                    "key": "PaneController",
                    "implementation": PaneController,
                    "priority": "preferred",
                    "depends": [
                        "$scope",
                        "agentService",
                        "$window"
                    ]
                },
                {
                    "key": "BrowseObjectController",
                    "implementation": BrowseObjectController,
                    "depends": [
                        "$scope",
                        "$location",
                        "$route"
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
                },
                {
                    "key": "MenuArrowController",
                    "implementation": MenuArrowController,
                    "depends": [
                        "$scope"
                    ]
                }
            ],
            "controls": [
                {
                    "key": "locator",
                    "template": locatorTemplate
                }
            ],
            "representations": [
                {
                    "key": "view-object",
                    "templateUrl": "templates/view-object.html"
                },
                {
                    "key": "browse-object",
                    "template": browseObjectTemplate,
                    "gestures": [
                        "drop"
                    ],
                    "uses": [
                        "view"
                    ]
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
                },
                {
                    "key": "grid-item",
                    "template": gridItemTemplate,
                    "uses": [
                        "type",
                        "action",
                        "location"
                    ],
                    "gestures": [
                        "info",
                        "menu"
                    ]
                },
                {
                    "key": "object-header",
                    "template": objectHeaderTemplate,
                    "uses": [
                        "type"
                    ]
                },
                {
                    "key": "menu-arrow",
                    "template": menuArrowTemplate,
                    "uses": [
                        "action"
                    ],
                    "gestures": [
                        "menu"
                    ]
                },
                {
                    "key": "back-arrow",
                    "uses": [
                        "context"
                    ],
                    "template": backArrowTemplate
                },
                {
                    "key": "object-properties",
                    "template": objectPropertiesTemplate
                },
                {
                    "key": "inspector-region",
                    "template": inspectorRegionTemplate
                }
            ],
            "services": [
                {
                    "key": "navigationService",
                    "implementation": NavigationService
                }
            ],
            "policies": [
                {
                    "implementation": CreationPolicy,
                    "category": "creation"
                }
            ],
            "actions": [
                {
                    "key": "navigate",
                    "implementation": NavigateAction,
                    "depends": [
                        "navigationService",
                        "$q"
                    ]
                },
                {
                    "key": "window",
                    "name": "Open In New Tab",
                    "implementation": NewTabAction,
                    "description": "Open in a new browser tab",
                    "category": [
                        "view-control",
                        "contextual"
                    ],
                    "depends": [
                        "urlService",
                        "$window"
                    ],
                    "group": "windowing",
                    "glyph": "y",
                    "priority": "preferred"
                },
                {
                    "key": "fullscreen",
                    "implementation": FullscreenAction,
                    "category": "view-control",
                    "group": "windowing",
                    "glyph": "z",
                    "priority": "default"
                }
            ],
            "views": [
                {
                    "key": "items",
                    "name": "Items",
                    "glyph": "9",
                    "description": "Grid of available items",
                    "template": itemsTemplate,
                    "uses": [
                        "composition"
                    ],
                    "gestures": [
                        "drop"
                    ],
                    "type": "folder",
                    "editable": false
                }
            ],
            "components": [
                {
                    "key": "CreateActionProvider",
                    "provides": "actionService",
                    "type": "provider",
                    "implementation": CreateActionProvider,
                    "depends": [
                        "$q",
                        "typeService",
                        "navigationService",
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
            "runs": [
                {
                    "implementation": WindowTitler,
                    "depends": [
                        "navigationService",
                        "$rootScope",
                        "$document"
                    ]
                }
            ],
            "licenses": [
                {
                    "name": "screenfull.js",
                    "version": "1.2.0",
                    "description": "Wrapper for cross-browser usage of fullscreen API",
                    "author": "Sindre Sorhus",
                    "website": "https://github.com/sindresorhus/screenfull.js/",
                    "copyright": "Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (sindresorhus.com)",
                    "license": "license-mit",
                    "link": "https://github.com/sindresorhus/screenfull.js/blob/gh-pages/license"
                }
            ]
        }
    });
});
