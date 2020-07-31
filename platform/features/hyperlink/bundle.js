/*****************************************************************************
 * Open MCT, Copyright (c) 2009-2016, United States Government
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

define([
    './src/HyperlinkController',
    './res/templates/hyperlink.html'
], function (
    HyperlinkController,
    hyperlinkTemplate
) {
    return {
        name: "platform/features/hyperlink",
        definition: {
            "name": "Hyperlink",
            "description": "Insert a hyperlink to reference a link",
            "extensions": {
                "types": [
                    {
                        "key": "hyperlink",
                        "name": "Hyperlink",
                        "cssClass": "icon-chain-links",
                        "description": "A hyperlink to redirect to a different link",
                        "features": ["creation"],
                        "properties": [
                            {
                                "key": "url",
                                "name": "URL",
                                "control": "textfield",
                                "required": true,
                                "cssClass": "l-input-lg"
                            },

                            {
                                "key": "displayText",
                                "name": "Text to Display",
                                "control": "textfield",
                                "required": true,
                                "cssClass": "l-input-lg"
                            },
                            {
                                "key": "displayFormat",
                                "name": "Display Format",
                                "control": "select",
                                "options": [
                                    {
                                        "name": "Link",
                                        "value": "link"
                                    },
                                    {
                                        "value": "button",
                                        "name": "Button"
                                    }
                                ],
                                "cssClass": "l-inline"
                            },
                            {
                                "key": "openNewTab",
                                "name": "Tab to Open Hyperlink",
                                "control": "select",
                                "options": [
                                    {
                                        "name": "Open in this tab",
                                        "value": "thisTab"
                                    },
                                    {
                                        "value": "newTab",
                                        "name": "Open in a new tab"
                                    }
                                ],
                                "cssClass": "l-inline"

                            }
                        ],
                        "model": {
                            "displayFormat": "link",
                            "openNewTab": "thisTab",
                            "removeTitle": true
                        }

                    }
                ],
                "views": [
                    {
                        "key": "hyperlink",
                        "type": "hyperlink",
                        "name": "Hyperlink Display",
                        "template": hyperlinkTemplate,
                        "editable": false
                    }
                ],
                "controllers": [
                    {
                        "key": "HyperlinkController",
                        "implementation": HyperlinkController,
                        "depends": ["$scope"]
                    }
                ]
            }
        }
    };
});
