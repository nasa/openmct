/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2021, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT is licensed under the Apache License, Version 2.0 (the
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
 * Open MCT includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/

/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2021, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT is licensed under the Apache License, Version 2.0 (the
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
 * Open MCT includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/

import UrlService from './src/services/UrlService';

import PopupService from './src/services/PopupService';
import SplashScreenManager from './src/SplashScreenManager';
import StyleSheetLoader from './src/StyleSheetLoader';
import TimeRangeController from './src/controllers/TimeRangeController';
import DateTimePickerController from './src/controllers/DateTimePickerController';
import DateTimeFieldController from './src/controllers/DateTimeFieldController';
import TreeNodeController from './src/controllers/TreeNodeController';
import ActionGroupController from './src/controllers/ActionGroupController';
import ToggleController from './src/controllers/ToggleController';
import ClickAwayController from './src/controllers/ClickAwayController';
import ViewSwitcherController from './src/controllers/ViewSwitcherController';
import GetterSetterController from './src/controllers/GetterSetterController';
import SelectorController from './src/controllers/SelectorController';
import ObjectInspectorController from './src/controllers/ObjectInspectorController';
import BannerController from './src/controllers/BannerController';
import MCTContainer from './src/directives/MCTContainer';
import MCTDrag from './src/directives/MCTDrag';
import MCTSelectable from './src/directives/MCTSelectable';
import MCTClickElsewhere from './src/directives/MCTClickElsewhere';
import MCTResize from './src/directives/MCTResize';
import MCTPopup from './src/directives/MCTPopup';
import MCTScroll from './src/directives/MCTScroll';
import MCTSplitPane from './src/directives/MCTSplitPane';
import MCTSplitter from './src/directives/MCTSplitter';
import MCTTree from './src/directives/MCTTree';
import MCTIndicators from './src/directives/MCTIndicators';
import ReverseFilter from './src/filters/ReverseFilter';
import bottombarTemplate from './res/templates/bottombar.html';
import actionButtonTemplate from './res/templates/controls/action-button.html';
import inputFilterTemplate from './res/templates/controls/input-filter.html';
import indicatorTemplate from './res/templates/angular-indicator.html';
import messageBannerTemplate from './res/templates/message-banner.html';
import progressBarTemplate from './res/templates/progress-bar.html';
import timeControllerTemplate from './res/templates/controls/time-controller.html';
import accordionTemplate from './res/templates/containers/accordion.html';
import subtreeTemplate from './res/templates/subtree.html';
import treeTemplate from './res/templates/tree.html';
import treeNodeTemplate from './res/templates/tree-node.html';
import labelTemplate from './res/templates/label.html';
import actionGroupTemplate from './res/templates/controls/action-group.html';
import switcherTemplate from './res/templates/controls/switcher.html';
import objectInspectorTemplate from './res/templates/object-inspector.html';
import selectorTemplate from './res/templates/controls/selector.html';
import datetimePickerTemplate from './res/templates/controls/datetime-picker.html';
import datetimeFieldTemplate from './res/templates/controls/datetime-field.html';

export default {
    name: "platform/commonUI/general",
    definition: {
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
                        "THEME",
                        "ASSETS_PATH"
                    ]
                },
                {
                    "implementation": SplashScreenManager,
                    "depends": [
                        "$document"
                    ]
                }
            ],
            "filters": [
                {
                    "implementation": ReverseFilter,
                    "key": "reverse"
                }
            ],
            "templates": [
                {
                    "key": "bottombar",
                    "template": bottombarTemplate
                },
                {
                    "key": "action-button",
                    "template": actionButtonTemplate
                },
                {
                    "key": "input-filter",
                    "template": inputFilterTemplate
                },
                {
                    "key": "indicator",
                    "template": indicatorTemplate
                },
                {
                    "key": "message-banner",
                    "template": messageBannerTemplate
                },
                {
                    "key": "progress-bar",
                    "template": progressBarTemplate
                },
                {
                    "key": "time-controller",
                    "template": timeControllerTemplate
                }
            ],
            "controllers": [
                {
                    "key": "TimeRangeController",
                    "implementation": TimeRangeController,
                    "depends": [
                        "$scope",
                        "$timeout",
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
                    "key": "ClickAwayController",
                    "implementation": ClickAwayController,
                    "depends": [
                        "$document",
                        "$timeout"
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
                        "$document",
                        "agentService"
                    ]
                },
                {
                    "key": "mctSelectable",
                    "implementation": MCTSelectable,
                    "depends": [
                        "openmct"
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
                        "$interval",
                        "$window"
                    ]
                },
                {
                    "key": "mctSplitter",
                    "implementation": MCTSplitter
                },
                {
                    "key": "mctTree",
                    "implementation": MCTTree,
                    "depends": ['gestureService', 'openmct']
                },
                {
                    "key": "mctIndicators",
                    "implementation": MCTIndicators,
                    "depends": ['openmct']
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
                },
                {
                    "key": "ASSETS_PATH",
                    "value": ".",
                    "priority": "fallback"
                }
            ],
            "containers": [
                {
                    "key": "accordion",
                    "template": accordionTemplate,
                    "attributes": [
                        "label"
                    ]
                }
            ],
            "representations": [
                {
                    "key": "tree",
                    "template": subtreeTemplate,
                    "uses": [
                        "composition"
                    ],
                    "type": "root",
                    "priority": "preferred"
                },
                {
                    "key": "tree",
                    "template": treeTemplate
                },
                {
                    "key": "subtree",
                    "template": subtreeTemplate,
                    "uses": [
                        "composition"
                    ]
                },
                {
                    "key": "tree-node",
                    "template": treeNodeTemplate,
                    "uses": [
                        "action"
                    ]
                },
                {
                    "key": "label",
                    "template": labelTemplate,
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
                    "template": labelTemplate,
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
                    "template": actionGroupTemplate,
                    "uses": [
                        "action"
                    ]
                },
                {
                    "key": "switcher",
                    "template": switcherTemplate,
                    "uses": [
                        "view"
                    ]
                },
                {
                    "key": "object-inspector",
                    "template": objectInspectorTemplate
                }
            ],
            "controls": [
                {
                    "key": "selector",
                    "template": selectorTemplate
                },
                {
                    "key": "datetime-picker",
                    "template": datetimePickerTemplate
                },
                {
                    "key": "datetime-field",
                    "template": datetimeFieldTemplate
                }
            ],
            "licenses": [
                {
                    "name": "Normalize.css",
                    "version": "1.1.2",
                    "description": "Browser style normalization",
                    "author": "Nicolas Gallagher, Jonathan Neal",
                    "website": "http://necolas.github.io/normalize.css/",
                    "copyright": "Copyright (c) Nicolas Gallagher and Jonathan Neal",
                    "license": "license-mit",
                    "link": "https://github.com/necolas/normalize.css/blob/v1.1.2/LICENSE.md"
                },
                {
                    "name": "Zepto",
                    "version": "1.1.6",
                    "description": "DOM manipulation",
                    "author": "Thomas Fuchs",
                    "website": "http://zeptojs.com/",
                    "copyright": "Copyright (c) 2010-2016 Thomas Fuchs",
                    "license": "license-mit",
                    "link": "https://github.com/madrobby/zepto/blob/master/MIT-LICENSE"
                }
            ]
        }
    }
};