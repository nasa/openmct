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

/**
 * This bundle adds the Hyperlink object type, which can be used to add hyperlinks as a domain Object type
 and into display Layouts as either a button or link that can be chosen to open in either the same tab or
 create a new tab to open the link in
 * @namespace platform/features/hyperlink
 */
define(
    [],
    function () {
        function HyperlinkController($scope) {
            this.$scope = $scope;
        }

        /**Function to analyze the location in which to open the hyperlink
        @returns true if the hyperlink is chosen to open in a different tab, false if the same tab
        **/
        HyperlinkController.prototype.openNewTab = function () {
            if (this.$scope.domainObject.getModel().openNewTab === "thisTab") {
                return false;
            } else {
                return true;
            }
        };

        /**Function to specify the format in which the hyperlink should be created
        @returns true if the hyperlink is chosen to be created as a button, false if a link
        **/
        HyperlinkController.prototype.isButton = function () {
            if (this.$scope.domainObject.getModel().displayFormat === "link") {
                return false;
            }

            return true;
        };

        return HyperlinkController;
    }

);
