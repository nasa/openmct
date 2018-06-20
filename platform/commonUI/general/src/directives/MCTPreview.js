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

define(['zepto', '../services/Overlay'], function ($, Overlay) {
    function MCTPreview($document) {

        function link($scope, $element) {
            var actions = $scope.domainObject.getCapability('action'),
                notebookAction = actions.getActions({key: 'notebook-new-entry'})[0];

            var notebookButton = notebookAction ?
            [
                {
                    class: 'icon-notebook new-notebook-entry',
                    title: 'New Notebook Entry',
                    clickHandler: function (event) {
                        event.stopPropagation();
                        notebookAction.perform();
                    }
                }
            ] : [];

            var overlayService = new Overlay({
                $document: $document,
                $element: $element[0],
                $scope: $scope,
                browseBarButtons: notebookButton
            });

            overlayService.toggleOverlay();

            $scope.$on('$destroy', function () {
                $element.remove();
            });
        }

        return {
            restrict: 'A',
            link: link
        };
    }

    return MCTPreview;

});
