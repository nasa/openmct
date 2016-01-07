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
    "./src/MCTForm",
    "./src/MCTToolbar",
    "./src/MCTControl",
    "./src/controllers/DateTimeController",
    "./src/controllers/CompositeController",
    "./src/controllers/ColorController",
    "./src/controllers/DialogButtonController",
    'legacyRegistry'
], function (
    MCTForm,
    MCTToolbar,
    MCTControl,
    DateTimeController,
    CompositeController,
    ColorController,
    DialogButtonController,
    legacyRegistry
) {
    "use strict";

    legacyRegistry.register("platform/forms", {
        "name": "MCT Forms",
        "description": "Form generator; includes directive and some controls.",
        "extensions": {
            "directives": [
                {
                    "key": "mctForm",
                    "implementation": MCTForm
                },
                {
                    "key": "mctToolbar",
                    "implementation": MCTToolbar
                },
                {
                    "key": "mctControl",
                    "implementation": MCTControl,
                    "depends": [
                        "controls[]"
                    ]
                }
            ],
            "controls": [
                {
                    "key": "checkbox",
                    "templateUrl": "templates/controls/checkbox.html"
                },
                {
                    "key": "datetime",
                    "templateUrl": "templates/controls/datetime.html"
                },
                {
                    "key": "select",
                    "templateUrl": "templates/controls/select.html"
                },
                {
                    "key": "textfield",
                    "templateUrl": "templates/controls/textfield.html"
                },
                {
                    "key": "button",
                    "templateUrl": "templates/controls/button.html"
                },
                {
                    "key": "color",
                    "templateUrl": "templates/controls/color.html"
                },
                {
                    "key": "composite",
                    "templateUrl": "templates/controls/composite.html"
                },
                {
                    "key": "menu-button",
                    "templateUrl": "templates/controls/menu-button.html"
                },
                {
                    "key": "dialog-button",
                    "templateUrl": "templates/controls/dialog.html"
                }
            ],
            "controllers": [
                {
                    "key": "DateTimeController",
                    "implementation": DateTimeController,
                    "depends": [
                        "$scope"
                    ]
                },
                {
                    "key": "CompositeController",
                    "implementation": CompositeController
                },
                {
                    "key": "ColorController",
                    "implementation": ColorController
                },
                {
                    "key": "DialogButtonController",
                    "implementation": DialogButtonController,
                    "depends": [
                        "$scope",
                        "dialogService"
                    ]
                }
            ]
        }
    });
});
