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
    "./src/services/UrlService",
    "./src/services/PopupService",
    "./src/StyleSheetLoader",
    "./src/UnsupportedBrowserWarning",
    "./src/controllers/TimeRangeController",
    "./src/controllers/DateTimePickerController",
    "./src/controllers/DateTimeFieldController",
    "./src/controllers/TreeNodeController",
    "./src/controllers/ActionGroupController",
    "./src/controllers/ToggleController",
    "./src/controllers/ContextMenuController",
    "./src/controllers/ClickAwayController",
    "./src/controllers/ViewSwitcherController",
    "./src/controllers/BottomBarController",
    "./src/controllers/GetterSetterController",
    "./src/controllers/SelectorController",
    "./src/controllers/ObjectInspectorController",
    "./src/controllers/BannerController",
    "./src/directives/MCTContainer",
    "./src/directives/MCTDrag",
    "./src/directives/MCTClickElsewhere",
    "./src/directives/MCTResize",
    "./src/directives/MCTPopup",
    "./src/directives/MCTScroll",
    "./src/directives/MCTSplitPane",
    "./src/directives/MCTSplitter",
    'legacyRegistry'
], function (
    UrlService,
    PopupService,
    StyleSheetLoader,
    UnsupportedBrowserWarning,
    TimeRangeController,
    DateTimePickerController,
    DateTimeFieldController,
    TreeNodeController,
    ActionGroupController,
    ToggleController,
    ContextMenuController,
    ClickAwayController,
    ViewSwitcherController,
    BottomBarController,
    GetterSetterController,
    SelectorController,
    ObjectInspectorController,
    BannerController,
    MCTContainer,
    MCTDrag,
    MCTClickElsewhere,
    MCTResize,
    MCTPopup,
    MCTScroll,
    MCTSplitPane,
    MCTSplitter,
    legacyRegistry
) {
    "use strict";

    legacyRegistry.register("platform/commonUI/general", {
        "name": "General UI elements",
        "description": "General UI elements, meant to be reused across modes",
        "resources": "res",
        "extensions": {
            "services": [
                {
                    "key": "urlService",
                    "implementation": UrlService,
                    "depends": [
                        "$location"
                    ]
                },
                {
                    "key": "popupService",
                    "implementation": PopupService,
                    "depends": [
                        "$document",
                        "$window"
                    ]
                }
            ],
            "runs": [
                {
                    "implementation": StyleSheetLoader,
                    "depends": [
                        "stylesheets[]",
                        "$document",
                        "THEME"
                    ]
                },
                {
                    "implementation": UnsupportedBrowserWarning,
                    "depends": [
                        "notificationService",
                        "agentService"
                    ]
                }
            ],
            "stylesheets": [
                {
                    "stylesheetUrl": "css/normalize.min.css",
                    "priority": "mandatory"
                }
            ],
            "templates": [
                {
                    "key": "bottombar",
                    "templateUrl": "templates/bottombar.html"
                },
                {
                    "key": "action-button",
                    "templateUrl": "templates/controls/action-button.html"
                },
                {
                    "key": "input-filter",
                    "templateUrl": "templates/controls/input-filter.html"
                },
                {
                    "key": "indicator",
                    "templateUrl": "templates/indicator.html"
                },
                {
                    "key": "message-banner",
                    "templateUrl": "templates/message-banner.html"
                },
                {
                    "key": "progress-bar",
                    "templateUrl": "templates/progress-bar.html"
                },
                {
                    "key": "time-controller",
                    "templateUrl": "templates/controls/time-controller.html"
                }
            ],
            "controllers": [
                {
                    "key": "TimeRangeController",
                    "implementation": TimeRangeController,
                    "depends": [
                        "$scope",
                        "formatService",
                        "DEFAULT_TIME_FORMAT",
                        "now"
                    ]
                },
                {
                    "key": "DateTimePickerController",
                    "implementation": DateTimePickerController,
                    "depends": [
                        "$scope",
                        "now"
                    ]
                },
                {
                    "key": "DateTimeFieldController",
                    "implementation": DateTimeFieldController,
                    "depends": [
                        "$scope",
                        "formatService",
                        "DEFAULT_TIME_FORMAT"
                    ]
                },
                {
                    "key": "TreeNodeController",
                    "implementation": TreeNodeController,
                    "depends": [
                        "$scope",
                        "$timeout",
                        "navigationService"
                    ]
                },
                {
                    "key": "ActionGroupController",
                    "implementation": ActionGroupController,
                    "depends": [
                        "$scope"
                    ]
                },
                {
                    "key": "ToggleController",
                    "implementation": ToggleController
                },
                {
                    "key": "ContextMenuController",
                    "implementation": ContextMenuController,
                    "depends": [
                        "$scope"
                    ]
                },
                {
                    "key": "ClickAwayController",
                    "implementation": ClickAwayController,
                    "depends": [
                        "$scope",
                        "$document"
                    ]
                },
                {
                    "key": "ViewSwitcherController",
                    "implementation": ViewSwitcherController,
                    "depends": [
                        "$scope",
                        "$timeout"
                    ]
                },
                {
                    "key": "BottomBarController",
                    "implementation": BottomBarController,
                    "depends": [
                        "indicators[]"
                    ]
                },
                {
                    "key": "GetterSetterController",
                    "implementation": GetterSetterController,
                    "depends": [
                        "$scope"
                    ]
                },
                {
                    "key": "SelectorController",
                    "implementation": SelectorController,
                    "depends": [
                        "objectService",
                        "$scope"
                    ]
                },
                {
                    "key": "ObjectInspectorController",
                    "implementation": ObjectInspectorController,
                    "depends": [
                        "$scope",
                        "objectService"
                    ]
                },
                {
                    "key": "BannerController",
                    "implementation": BannerController,
                    "depends": [
                        "$scope",
                        "notificationService",
                        "dialogService"
                    ]
                }
            ],
            "directives": [
                {
                    "key": "mctContainer",
                    "implementation": MCTContainer,
                    "depends": [
                        "containers[]"
                    ]
                },
                {
                    "key": "mctDrag",
                    "implementation": MCTDrag,
                    "depends": [
                        "$document"
                    ]
                },
                {
                    "key": "mctClickElsewhere",
                    "implementation": MCTClickElsewhere,
                    "depends": [
                        "$document"
                    ]
                },
                {
                    "key": "mctResize",
                    "implementation": MCTResize,
                    "depends": [
                        "$timeout"
                    ]
                },
                {
                    "key": "mctPopup",
                    "implementation": MCTPopup,
                    "depends": [
                        "$compile",
                        "popupService"
                    ]
                },
                {
                    "key": "mctScrollX",
                    "implementation": MCTScroll,
                    "depends": [
                        "$parse",
                        "MCT_SCROLL_X_PROPERTY",
                        "MCT_SCROLL_X_ATTRIBUTE"
                    ]
                },
                {
                    "key": "mctScrollY",
                    "implementation": MCTScroll,
                    "depends": [
                        "$parse",
                        "MCT_SCROLL_Y_PROPERTY",
                        "MCT_SCROLL_Y_ATTRIBUTE"
                    ]
                },
                {
                    "key": "mctSplitPane",
                    "implementation": MCTSplitPane,
                    "depends": [
                        "$parse",
                        "$log",
                        "$interval"
                    ]
                },
                {
                    "key": "mctSplitter",
                    "implementation": MCTSplitter
                }
            ],
            "constants": [
                {
                    "key": "MCT_SCROLL_X_PROPERTY",
                    "value": "scrollLeft"
                },
                {
                    "key": "MCT_SCROLL_X_ATTRIBUTE",
                    "value": "mctScrollX"
                },
                {
                    "key": "MCT_SCROLL_Y_PROPERTY",
                    "value": "scrollTop"
                },
                {
                    "key": "MCT_SCROLL_Y_ATTRIBUTE",
                    "value": "mctScrollY"
                },
                {
                    "key": "THEME",
                    "value": "unspecified",
                    "priority": "fallback"
                }
            ],
            "containers": [
                {
                    "key": "accordion",
                    "templateUrl": "templates/containers/accordion.html",
                    "attributes": [
                        "label"
                    ]
                }
            ],
            "representations": [
                {
                    "key": "tree",
                    "templateUrl": "templates/subtree.html",
                    "uses": [
                        "composition"
                    ],
                    "type": "root",
                    "priority": "preferred"
                },
                {
                    "key": "tree",
                    "templateUrl": "templates/tree.html"
                },
                {
                    "key": "subtree",
                    "templateUrl": "templates/subtree.html",
                    "uses": [
                        "composition"
                    ]
                },
                {
                    "key": "tree-node",
                    "templateUrl": "templates/tree-node.html",
                    "uses": [
                        "action"
                    ]
                },
                {
                    "key": "label",
                    "templateUrl": "templates/label.html",
                    "uses": [
                        "type",
                        "location"
                    ],
                    "gestures": [
                        "drag",
                        "menu",
                        "info"
                    ]
                },
                {
                    "key": "node",
                    "templateUrl": "templates/label.html",
                    "uses": [
                        "type"
                    ],
                    "gestures": [
                        "drag",
                        "menu"
                    ]
                },
                {
                    "key": "action-group",
                    "templateUrl": "templates/controls/action-group.html",
                    "uses": [
                        "action"
                    ]
                },
                {
                    "key": "context-menu",
                    "templateUrl": "templates/menu/context-menu.html",
                    "uses": [
                        "action"
                    ]
                },
                {
                    "key": "switcher",
                    "templateUrl": "templates/controls/switcher.html",
                    "uses": [
                        "view"
                    ]
                },
                {
                    "key": "object-inspector",
                    "templateUrl": "templates/object-inspector.html"
                }
            ],
            "controls": [
                {
                    "key": "selector",
                    "templateUrl": "templates/controls/selector.html"
                },
                {
                    "key": "datetime-picker",
                    "templateUrl": "templates/controls/datetime-picker.html"
                },
                {
                    "key": "datetime-field",
                    "templateUrl": "templates/controls/datetime-field.html"
                }
            ],
            "licenses": [
                {
                    "name": "Modernizr",
                    "version": "2.6.2",
                    "description": "Browser/device capability finding",
                    "author": "Faruk Ateş",
                    "website": "http://modernizr.com",
                    "copyright": "Copyright (c) 2009–2015",
                    "license": "license-mit",
                    "link": "http://modernizr.com/license/"
                },
                {
                    "name": "Normalize.css",
                    "version": "1.1.2",
                    "description": "Browser style normalization",
                    "author": "Nicolas Gallagher, Jonathan Neal",
                    "website": "http://necolas.github.io/normalize.css/",
                    "copyright": "Copyright (c) Nicolas Gallagher and Jonathan Neal",
                    "license": "license-mit",
                    "link": "https://github.com/necolas/normalize.css/blob/v1.1.2/LICENSE.md"
                }
            ]
        }
    });
});
