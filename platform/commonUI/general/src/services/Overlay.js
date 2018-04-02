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

 /**
 * Module defining OverlayService. Created by deeptailor on 03/29/2018
 */

define(['zepto'], function ($) {
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

    var NEW_NOTEBOOK_BUTTON_TEMPLATE = '<a class="s-button labeled icon-notebook new-notebook-entry" title="New Notebook Entry">' +
        '<span class="title-label">New Notebook Entry</span>' +
        '</a>';

    /*
     *  An Overlay Service when instantiated creates an overlay dialog.
     *  @param {Object} options The options object required to instantiate the overlay service
     *  options = {
     *      $document: document object,
     *      $scope: angular $scope object,
     *      element: node to be injected into overlay as a view,
     *      overlayWillMount: callback executed before overlay is injected,
     *      overlayWillUnmount: callback executed before overlay is removed,
     *      overlayDidMount: callback executed after overlay is injected,
     *      overlayDidUnmount: callback executed after overlay is removed
     *  }
     *  $document, $scope and element are required
     */

    function Overlay(options) {
        this.element = options.$element;
        this.document = options.$document[0];
        this.$scope = options.$scope;

        this.overlayWillMount = options.overlayWillMount;
        this.overlayWillUnmount = options.overlayWillUnmount;

        this.overlayDidMount = options.overlayDidMount;
        this.overlayDidUnmount = options.overlayDidUnmount;

        var actions = this.$scope.domainObject.getCapability('action');
        this.notebookAction = actions.getActions({key: 'notebook-new-entry'})[0];

        this.openOverlay = this.openOverlay.bind(this);
        this.closeOverlay = this.closeOverlay.bind(this);
        this.toggleOverlay = this.toggleOverlay.bind(this);

        this.isOverlayOpen = false;
    }

    Overlay.prototype.openOverlay = function () {

        if (this.overlayWillMount && typeof this.overlayWillMount === 'function') {
            this.overlayWillMount();
        }

        this.overlay = this.document.createElement('div');
        $(this.overlay).addClass('abs overlay l-large-view');
        this.overlay.innerHTML = OVERLAY_TEMPLATE;

        this.overlayContainer = this.overlay.querySelector('.t-contents');

        this.closeButton =  this.overlay.querySelector('a.close');
        this.closeButton.addEventListener('click', this.toggleOverlay);

        this.doneButton = this.overlay.querySelector('a.t-done');
        this.doneButton.addEventListener('click', this.toggleOverlay);

        this.blocker = this.overlay.querySelector('.abs.blocker');
        this.blocker.addEventListener('click', this.toggleOverlay);

        this.document.body.appendChild(this.overlay);

        this.overlayContainer.appendChild(this.element);

        if (this.notebookAction) {
            this.notebookButton = document.createElement('div');
            $(this.notebookButton).addClass('notebook-button-container holder flex-elem');
            this.notebookButton.innerHTML = NEW_NOTEBOOK_BUTTON_TEMPLATE;

            this.browseBar = this.overlay.querySelector('.object-browse-bar .right');
            this.browseBar.prepend(this.notebookButton);

            var perform = this.notebookAction.perform;

            this.notebookButton.addEventListener('click', function (event) {
                event.stopPropagation();
                perform();
            });
        }

        if (this.overlayDidMount && typeof this.overlayDidMount === 'function') {
            this.overlayDidMount();
        }
    };

    Overlay.prototype.closeOverlay = function () {

        if (this.overlayWillUnmount && typeof this.overlayWillUnmount === 'function') {
            this.overlayWillUnmount();
        }

        this.overlayContainer.removeChild(this.element);
        this.document.body.removeChild(this.overlay);

        this.closeButton.removeEventListener('click', this.toggleOverlay);
        this.closeButton = undefined;

        this.doneButton.removeEventListener('click', this.toggleOverlay);
        this.doneButton = undefined;

        this.blocker.removeEventListener('click', this.toggleOverlay);
        this.blocker = undefined;

        this.overlayContainer = undefined;
        this.overlay = undefined;

        if (this.notebookButton) {
            this.browseBar.removeChild(this.notebookButton);
            this.notebookButton.remove();
            this.notebookButton = undefined;
        }

        if (this.overlayDidUnmount && typeof this.overlayDidUnmount === 'function') {
            this.overlayDidUnmount();
        }
    };

    Overlay.prototype.toggleOverlay = function (event) {
        if (event) {
            event.stopPropagation();
        }

        if (!this.isOverlayOpen) {
            this.openOverlay();
            this.isOverlayOpen = true;
        } else {
            this.closeOverlay();
            this.isOverlayOpen = false;
        }
    };

    return Overlay;
});
