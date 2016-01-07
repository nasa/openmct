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
/*global define,Promise*/

define(['legacyRegistry'], function (legacyRegistry) {
    "use strict";

    legacyRegistry.register("platform/commonUI/browse", {
        "extensions": {
            "routes": [
                {
                    "when": "/browse/:ids*",
                    "templateUrl": "templates/browse.html",
                    "reloadOnSearch": false
                },
                {
                    "when": "",
                    "templateUrl": "templates/browse.html",
                    "reloadOnSearch": false
                }
            ],
            "controllers": [
                {
                    "key": "BrowseController",
                    "implementation": "BrowseController.js",
                    "depends": [
                        "$scope",
                        "$route",
                        "$location",
                        "objectService",
                        "navigationService",
                        "urlService"
                    ]
                },
                {
                    "key": "PaneController",
                    "implementation": "PaneController.js",
                    "priority": "preferred",
                    "depends": [ "$scope", "agentService","$window" ]
                },
                {
                    "key": "BrowseObjectController",
                    "implementation": "BrowseObjectController.js",
                    "depends": [ "$scope", "$location", "$route" ]
                },
                {
                    "key": "CreateMenuController",
                    "implementation": "creation/CreateMenuController.js",
                    "depends": [ "$scope" ]
                },
                {
                    "key": "LocatorController",
                    "implementation": "creation/LocatorController.js",
                    "depends": [ "$scope", "$timeout" ]
                },
                {
                    "key": "MenuArrowController",
                    "implementation": "MenuArrowController.js",
                    "depends": [ "$scope" ]
                }
            ],
            "controls": [
                {
                    "key": "locator",
                    "templateUrl": "templates/create/locator.html"
                }
            ],
            "representations": [
                {
                    "key": "browse-object",
                    "templateUrl": "templates/browse-object.html",
                    "uses": [ "view" ]
                },
                {
                    "key": "create-button",
                    "templateUrl": "templates/create/create-button.html"
                },
                {
                    "key": "create-menu",
                    "templateUrl": "templates/create/create-menu.html",
                    "uses": [ "action" ]
                },
                {
                    "key": "grid-item",
                    "templateUrl": "templates/items/grid-item.html",
                    "uses": [ "type", "action", "location" ],
                    "gestures": [ "info", "menu" ]
                },
                {
                    "key": "object-header",
                    "templateUrl": "templates/browse/object-header.html",
                    "uses": [ "type" ]
                },
                {
                    "key": "menu-arrow",
                    "templateUrl": "templates/menu-arrow.html",
                    "uses": [ "action" ],
                    "gestures": [ "menu" ]
                },
                {
                    "key": "back-arrow",
                    "uses": [ "context" ],
                    "templateUrl": "templates/back-arrow.html"
                }
            ],
            "services": [
                {
                    "key": "navigationService",
                    "implementation": "navigation/NavigationService.js"
                }
            ],
            "policies": [
                {
                    "implementation": "creation/CreationPolicy.js",
                    "category": "creation"
                }
            ],
            "actions": [
                {
                    "key": "navigate",
                    "implementation": "navigation/NavigateAction.js",
                    "depends": [ "navigationService", "$q" ]
                },
                {
                    "key": "window",
                    "name": "Open In New Tab",
                    "implementation": "windowing/NewTabAction.js",
                    "description": "Open in a new browser tab",
                    "category": ["view-control", "contextual"],
                    "depends": [ "urlService", "$window" ],
                    "group": "windowing",
                    "glyph": "y",
                    "priority": "preferred"
                },
                {
                    "key": "fullscreen",
                    "implementation": "windowing/FullscreenAction.js",
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
                    "templateUrl": "templates/items/items.html",
                    "uses": [ "composition" ],
                    "gestures": [ "drop" ],
                    "type": "folder",
                    "editable": false
                }
            ],
            "components": [
                {
                    "key": "CreateActionProvider",
                    "provides": "actionService",
                    "type": "provider",
                    "implementation": "creation/CreateActionProvider.js",
                    "depends": [ "typeService", "dialogService", "creationService", "policyService" ]
                },
                {
                    "key": "CreationService",
                    "provides": "creationService",
                    "type": "provider",
                    "implementation": "creation/CreationService.js",
                    "depends": [ "$q", "$log" ]
                }
            ],
            "runs": [
                {
                    "implementation": "windowing/WindowTitler.js",
                    "depends": [ "navigationService", "$rootScope", "$document" ]
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