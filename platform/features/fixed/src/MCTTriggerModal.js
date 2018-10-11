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

define([
    'zepto',
    '../../../commonUI/general/src/services/Overlay'
], function (
    $,
    Overlay
) {
    /**
     * MCT Trigger Modal is intended for use in only one location: inside the
     * object-header to allow views in a layout to be popped out in a modal.
     * Users can close the modal and go back to normal, and everything generally
     * just works fine.
     *
     * This code is sensitive to how our html is constructed-- particularly with
     * how it locates the the container of an element in a layout. However, it
     * should be able to handle slight relocations so long as it is always a
     * descendent of a `.frame` element.
     */
    function MCTTriggerModal($document) {

        function link($scope, $element) {
            var actions = $scope.domainObject.getCapability('action'),
                notebookAction = actions.getActions({key: 'notebook-new-entry'})[0];

            var frame = $element.parent();

            for (var i = 0; i < 10; i++) {
                if (frame.hasClass('frame')) {
                    break;
                }
                frame = frame.parent();
            }
            if (!frame.hasClass('frame')) {
                $element.remove();
                return;
            }

            frame = frame[0];

            var layoutContainer = frame.parentElement;

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

            var overlayService = new Overlay ({
                $document: $document,
                $scope: $scope,
                $element: frame,
                overlayWillMount: function () {
                    $(frame).removeClass('frame frame-template');
                    layoutContainer.removeChild(frame);
                },
                overlayDidUnmount: function () {
                    $(frame).addClass('frame frame-template');
                    layoutContainer.appendChild(frame);
                },
                browseBarButtons: notebookButton
            });

            $element.on('click', overlayService.toggleOverlay);
            $scope.$on('$destroy', function () {
                $element.off('click', overlayService.toggleOverlay);
            });
        }

        return {
            restrict: 'A',
            link: link
        };
    }

    return MCTTriggerModal;

});
