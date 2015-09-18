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
 * Module defining ContextMenuGesture.
 * Created by vwoeltje on 11/17/14. Modified by shale on 06/30/2015.
 */
define(
    function () {
        "use strict";

        /**
         * Add listeners to a representation such that it calls the
         * context menu action for the domain object it contains.
         *
         * @memberof platform/representation
         * @constructor
         * @param element the jqLite-wrapped element which should exhibit
         *                the context menu
         * @param {DomainObject} domainObject the object on which actions
         *                       in the context menu will be performed
         * @implements {Gesture}
         */
        function ContextMenuGesture($timeout, agentService, element, domainObject) {
            var isPressing,
                longTouchTime = 500;

            function showMenu(event) {
                domainObject.getCapability('action').perform({
                    key: 'menu',
                    domainObject: domainObject,
                    event: event
                });
            }

            // When context menu event occurs, show object actions instead
            if (!agentService.isMobile()) {

                // When context menu event occurs, show object actions instead
                element.on('contextmenu', showMenu);
            } else if (agentService.isMobile()) {

                // If on mobile device, then start timeout for the single touch event
                // during the timeout 'isPressing' is true.
                element.on('touchstart', function (event) {
                    if (event.touches.length < 2) {
                        isPressing = true;

                        // After the timeout, if 'isPressing' is
                        // true, display context menu for object
                        $timeout(function () {
                            if (isPressing) {
                                showMenu(event);
                            }
                        }, longTouchTime);
                    }
                });

                // Whenever the touch event ends, 'isPressing' is false.
                element.on('touchend', function (event) {
                    isPressing = false;
                });
            }

            this.showMenuCallback = showMenu;
            this.element = element;
        }

        ContextMenuGesture.prototype.destroy = function () {
            this.element.off('contextmenu', this.showMenu);
        };

        return ContextMenuGesture;
    }
);
