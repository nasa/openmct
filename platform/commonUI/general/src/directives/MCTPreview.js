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

define(['zepto'], function ($) {

    var OVERLAY_TEMPLATE = '' +
'    <div class="abs blocker"></div>' +
'    <div class="abs outer-holder">' +
'       <a class="close icon-x-in-circle"></a>' +
'       <div class="top-bar flex-elem holder"></div>' +
'       <div class="abs inner-holder l-flex-col">' +
'           <div class="t-contents flex-elem holder grows"></div>' +
'           <div class="bottom-bar flex-elem holder">' +
'               <a class="t-done s-button major">Done</a>' +
'           </div>' +
'       </div>' +
'    </div>';

    var NEW_NOTEBOOK_BUTTON_TEMPLATE = '<a class="s-button labeled icon-notebook new-notebook-entry" title="New Notebook Entry">' +
    '<span class="title-label">New Notebook Entry</span>' +
    '</a>';
    /**

     */
    function MCTPreview($rootScope,$document,exportImageService,dialogService,notificationService) {
        var document = $document[0];

        function link($scope, $element, $attrs) {
            var isOpen = false,
                toggleOverlay,
                overlay,
                closeButton,
                doneButton,
                blocker,
                overlayContainer,
                notebookButtonEl,
                browseBar;

            var actions = $scope.domainObject.getCapability('action'),
            notebookAction = actions.getActions({key: 'notebook-new-entry'});

            function openOverlay() {
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
                overlayContainer.appendChild($element[0]);

                if (notebookAction) {
                    notebookButtonEl = document.createElement('div');
                    $(notebookButtonEl).addClass('notebook-button-container');
                    notebookButtonEl.innerHTML = NEW_NOTEBOOK_BUTTON_TEMPLATE;
                    browseBar = overlay.querySelector('.top-bar');
                    browseBar.prepend(notebookButtonEl);
                    notebookButtonEl.addEventListener('click', function () {
                        notebookAction[0].perform();
                    });
                }
            }

            function closeOverlay() {
                if (notebookButtonEl) {
                    browseBar.removeChild(notebookButtonEl);
                    notebookButtonEl.remove();
                }

                overlayContainer.removeChild($element[0]);
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

            toggleOverlay = function (event) {
                if (event) {
                    event.stopPropagation();
                }

                if (!isOpen) {
                    openOverlay();
                    isOpen = true;
                } else {
                    closeOverlay();
                    isOpen = false;
                }
            };

            toggleOverlay();

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
