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
    [],
    function () {
        "use strict";

        /**
         * Controller which is responsible for populating the scope for
         * Edit mode
         * @memberof platform/commonUI/edit
         * @constructor
         */
        function EditObjectController($scope, $location, policyService) {
            this.scope = $scope;
            this.policyService = policyService;

            var navigatedObject;
            function setViewForDomainObject(domainObject) {

                var locationViewKey = $location.search().view;

                function selectViewIfMatching(view) {
                    if (view.key === locationViewKey) {
                        $scope.representation = $scope.representation || {};
                        $scope.representation.selected = view;
                    }
                }

                if (locationViewKey) {
                    ((domainObject && domainObject.useCapability('view')) || [])
                        .forEach(selectViewIfMatching);
                }
                navigatedObject = domainObject;
            }

            $scope.$watch('domainObject', setViewForDomainObject);

            $scope.doAction = function (action){
                return $scope[action] && $scope[action]();
            };
        }

        /**
         * Get the warning to show if the user attempts to navigate
         * away from Edit mode while unsaved changes are present.
         * @returns {string} the warning to show, or undefined if
         *          there are no unsaved changes
         */
        EditObjectController.prototype.getUnloadWarning = function () {
            var navigatedObject = this.scope.domainObject,
                policyMessage;

            this.policyService.allow("navigation", navigatedObject, undefined, function(message) {
               policyMessage = message;
            });

            return policyMessage;

        };

        return EditObjectController;
    }
);
