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
    "text!./res/templates/controls/checkbox.html",
    "text!./res/templates/controls/datetime.html",
    "text!./res/templates/controls/select.html",
    "text!./res/templates/controls/textfield.html",
    "text!./res/templates/controls/button.html",
    "text!./res/templates/controls/color.html",
    "text!./res/templates/controls/composite.html",
    "text!./res/templates/controls/menu-button.html",
    "text!./res/templates/controls/dialog.html",
    "text!./res/templates/controls/radio.html",
    'legacyRegistry'
], function (
    MCTForm,
    MCTToolbar,
    MCTControl,
    DateTimeController,
    CompositeController,
    ColorController,
    DialogButtonController,
    checkboxTemplate,
    datetimeTemplate,
    selectTemplate,
    textfieldTemplate,
    buttonTemplate,
    colorTemplate,
    compositeTemplate,
    menuButtonTemplate,
    dialogTemplate,
    radioTemplate,
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
                        "templateLinker",
                        "controls[]"
                    ]
                }
            ],
            "controls": [
                {
                    "key": "checkbox",
                    "template": checkboxTemplate
                },
                {
                    "key": "radio",
                    "template": radioTemplate
                },
                {
                    "key": "datetime",
                    "template": datetimeTemplate
                },
                {
                    "key": "select",
                    "template": selectTemplate
                },
                {
                    "key": "textfield",
                    "template": textfieldTemplate
                },
                {
                    "key": "button",
                    "template": buttonTemplate
                },
                {
                    "key": "color",
                    "template": colorTemplate
                },
                {
                    "key": "composite",
                    "template": compositeTemplate
                },
                {
                    "key": "menu-button",
                    "template": menuButtonTemplate
                },
                {
                    "key": "dialog-button",
                    "template": dialogTemplate
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
