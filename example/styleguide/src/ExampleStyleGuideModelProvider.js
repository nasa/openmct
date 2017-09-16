/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2016, United States Government
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
/*global define*/

define(
    [],
    function () {
        "use strict";

        function ExampleStyleGuideModelProvider($q) {
            var pages = {};

            // Add pages
            pages['intro'] = { name: "Introduction", type: "styleguide.intro", location: "styleguide:home" };
            pages['standards'] = { name: "Standards", type: "styleguide.standards", location: "styleguide:home" };
            pages['colors'] = { name: "Colors", type: "styleguide.colors", location: "styleguide:home" };
            pages['glyphs'] = { name: "Glyphs", type: "styleguide.glyphs", location: "styleguide:home" };
            pages['status'] = { name: "Status Indication", type: "styleguide.status", location: "styleguide:home" };
            pages['controls'] = { name: "Controls", type: "styleguide.controls", location: "styleguide:ui-elements" };
            pages['input'] = { name: "Text Inputs", type: "styleguide.input", location: "styleguide:ui-elements" };
            pages['menus'] = { name: "Menus", type: "styleguide.menus", location: "styleguide:ui-elements" };

            return {
                getModels: function () {
                    return $q.when(pages);
                }
            };
        }

        return ExampleStyleGuideModelProvider
    }
);