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

/**
 * This bundle implements Edit mode.
 * @namespace platform/commonUI/edit
 */
define(
    ["../objects/EditableDomainObject"],
    function (EditableDomainObject) {
        "use strict";

        /**
         * Controller which is responsible for populating the scope for
         * Edit mode; introduces an editable version of the currently
         * navigated domain object into the scope.
         * @memberof platform/commonUI/edit
         * @constructor
         */
        function EditController($scope, $q, navigationService) {
            var self = this;

            function setNavigation(domainObject) {
                // Wrap the domain object such that all mutation is
                // confined to edit mode (until Save)
                self.navigatedDomainObject =
                    domainObject && new EditableDomainObject(domainObject, $q);
            }

            setNavigation(navigationService.getNavigation());
            navigationService.addListener(setNavigation);
            $scope.$on("$destroy", function () {
                navigationService.removeListener(setNavigation);
            });
        }

        /**
         * Get the domain object which is navigated-to.
         * @returns {DomainObject} the domain object that is navigated-to
         */
        EditController.prototype.navigatedObject = function () {
            return this.navigatedDomainObject;
        };

        /**
         * Get the warning to show if the user attempts to navigate
         * away from Edit mode while unsaved changes are present.
         * @returns {string} the warning to show, or undefined if
         *          there are no unsaved changes
         */
        EditController.prototype.getUnloadWarning = function () {
            var navigatedObject = this.navigatedDomainObject,
                editorCapability = navigatedObject &&
                    navigatedObject.getCapability("editor"),
                hasChanges = editorCapability && editorCapability.dirty();

            return hasChanges ?
                "Unsaved changes will be lost if you leave this page." :
                undefined;
        };

        return EditController;
    }
);
