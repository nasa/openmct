/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2017, United States Government
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
    ['../../browse/src/InspectorRegion'],
    function (InspectorRegion) {

        /**
         * The InspectorController adds region data for a domain object's type
         * to the scope.
         *
         * @constructor
         */
        function InspectorController($scope, policyService, openmct, $document) {
            window.inspectorScope = $scope;

            function setSelection(selection) {

                if (selection[0]) {
                    var view = openmct.inspectorViews.get(selection);
                    if (view) {
                        var container = $document[0].querySelectorAll('.custom-view')[0];
                        view.show(container);
                    } else {
                        $scope.inspectorKey = selection[0].oldItem.getCapability("type").typeDef.inspector;    
                    }
                }

                $scope.selection = selection;
            }

            openmct.selection.on("change", setSelection);
            setSelection(openmct.selection.get());

            $scope.$on("$destroy", function () {
                openmct.selection.off("change", setSelection);
            });
        }

        return InspectorController;
    }
);
