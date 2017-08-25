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
    'zepto'
], function (
    $
) {

    var OVERLAY_TEMPLATE = '' +
'    <div class="abs blocker"></div>' +
'    <div class="abs outer-holder">' +
'       <a class="close icon-x-in-circle"></a>' +
'       <div class="abs inner-holder l-flex-col">' +
'           <div class="t-contents flex-elem holder grows"></div>' +
'           <div class="bottom-bar flex-elem holder">' +
'               <a class="t-done s-button major">Done</a>' +
'           </div>' +
'       </div>' +
'    </div>';

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
        var document = $document[0];

        function link($scope, $element) {
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
            var layoutContainer = frame.parentElement,
                isOpen = false,
                toggleOverlay,
                overlay,
                closeButton,
                doneButton,
                blocker,
                overlayContainer;

            function openOverlay() {
                // Remove frame classes from being applied in a non-frame context
                $(frame).removeClass('frame frame-template');
                overlay = document.createElement('div');
                $(overlay).addClass('abs overlay l-large-view');
                overlay.innerHTML = OVERLAY_TEMPLATE;
                overlayContainer = overlay.querySelector('.t-contents');
                closeButton = overlay.querySelector('a.close');
                closeButton.addEventListener('click', toggleOverlay);
                doneButton = overlay.querySelector('a.t-done');
                doneButton.addEventListener('click', toggleOverlay);
                blocker = overlay.querySelector('.abs.blocker');
                blocker.addEventListener('click', toggleOverlay);
                document.body.appendChild(overlay);
                layoutContainer.removeChild(frame);
                overlayContainer.appendChild(frame);
            }

            function closeOverlay() {
                $(frame).addClass('frame frame-template');
                overlayContainer.removeChild(frame);
                layoutContainer.appendChild(frame);
                document.body.removeChild(overlay);
                closeButton.removeEventListener('click', toggleOverlay);
                closeButton = undefined;
                doneButton.removeEventListener('click', toggleOverlay);
                doneButton = undefined;
                blocker.removeEventListener('click', toggleOverlay);
                blocker = undefined;
                overlayContainer = undefined;
                overlay = undefined;
            }

            toggleOverlay = function () {
                if (!isOpen) {
                    openOverlay();
                    isOpen = true;
                } else {
                    closeOverlay();
                    isOpen = false;
                }
            };

            $element.on('click', toggleOverlay);
            $scope.$on('$destroy', function () {
                $element.off('click', toggleOverlay);
            });
        }

        return {
            restrict: 'A',
            link: link
        };
    }

    return MCTTriggerModal;

});
