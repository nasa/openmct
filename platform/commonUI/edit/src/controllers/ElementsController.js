/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2018, United States Government
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

define(
    [],
    function () {

        /**
         * The ElementsController prepares the elements view for display
         *
         * @constructor
         */
        function ElementsController($scope, openmct) {
            this.scope = $scope;
            this.scope.composition = [];
            var self = this;

            function filterBy(text) {
                if (typeof text === 'undefined') {
                    return $scope.searchText;
                } else {
                    $scope.searchText = text;
                }
            }

            function searchElements(value) {
                if ($scope.searchText) {
                    return value.getModel().name.toLowerCase().search(
                            $scope.searchText.toLowerCase()) !== -1;
                } else {
                    return true;
                }
            }

            function setSelection(selection) {
                if (!selection[0]) {
                    return;
                }

                if (self.mutationListener) {
                    self.mutationListener();
                    delete self.mutationListener;
                }

                var domainObject = selection[0].context.oldItem;
                self.refreshComposition(domainObject);

                if (domainObject) {
                    self.mutationListener = domainObject.getCapability('mutation')
                        .listen(self.refreshComposition.bind(self, domainObject));
                }
            }

            $scope.filterBy = filterBy;
            $scope.searchElements = searchElements;

            openmct.selection.on('change', setSelection);
            setSelection(openmct.selection.get());

            $scope.$on("$destroy", function () {
                openmct.selection.off("change", setSelection);
            });
        }

        /**
         * Gets the composition for the selected object and populates the scope with it.
         *
         * @param domainObject the selected object
         * @private
         */
        ElementsController.prototype.refreshComposition = function (domainObject) {
            var refreshTracker = {};
            this.currentRefresh = refreshTracker;

            var selectedObjectComposition = domainObject && domainObject.useCapability('composition');
            if (selectedObjectComposition) {
                selectedObjectComposition.then(function (composition) {
                    if (this.currentRefresh === refreshTracker) {
                        this.scope.composition = composition;
                    }
                }.bind(this));
            } else {
                this.scope.composition = [];
            }
        };

        return ElementsController;
    }
);
