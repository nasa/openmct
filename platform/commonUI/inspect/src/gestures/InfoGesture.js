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
/*global define*/

define(
    [],
    function () {
        "use strict";

        /**
         * The `info` gesture displays domain object metadata in a
         * bubble on hover.
         *
         * @constructor
         * @param $timeout Angular's `$timeout`
         * @param {InfoService} infoService a service which shows info bubbles
         * @param {number} DELAY delay, in milliseconds, before bubble appears
         * @param element jqLite-wrapped DOM element
         * @param {DomainObject} domainObject the domain object for which to
         *        show information
         */
        function InfoGesture($timeout, queryService, infoService, DELAY, element, domainObject) {
            var dismissBubble,
                pendingBubble,
                mousePosition,
                scopeOff;

            function trackPosition(event) {
                // Record mouse position, so bubble can be shown at latest
                // mouse position (not just where the mouse entered)
                mousePosition = [ event.clientX, event.clientY ];
            }

            function hideBubble() {
                // If a bubble is showing, dismiss it
                if (dismissBubble) {
                    dismissBubble();
                    element.off('mouseleave', hideBubble);
                    dismissBubble = undefined;
                }
                // If a bubble will be shown on a timeout, cancel that
                if (pendingBubble) {
                    $timeout.cancel(pendingBubble);
                    element.off('mousemove', trackPosition);
                    element.off('mouseleave', hideBubble);
                    pendingBubble = undefined;
                }
                // Also clear mouse position so we don't have a ton of tiny
                // arrays allocated while user mouses over things
                mousePosition = undefined;
            }

            function showBubble(event) {
                trackPosition(event);
                
                // Also need to track position during hover
                element.on('mousemove', trackPosition);

                // Show the bubble, after a suitable delay (if mouse has
                // left before this time is up, this will be canceled.)
                pendingBubble = $timeout(function () {
                    dismissBubble = infoService.display(
                        "info-table",
                        domainObject.getModel().name,
                        domainObject.useCapability('metadata'),
                        mousePosition
                    );
                    element.off('mousemove', trackPosition);

                    pendingBubble = undefined;
                }, DELAY);

                element.on('mouseleave', hideBubble);
            }
            
            // Checks if you are on a mobile device, if the device is
            // not mobile (queryService.isMobile() = false), then
            // the pendingBubble and therefore hovering is allowed
            if (!queryService.isMobile(navigator.userAgent)) {
                // Show bubble (on a timeout) on mouse over
                element.on('mouseenter', showBubble);
            }

            // Also make sure we dismiss bubble if representation is destroyed
            // before the mouse actually leaves it
            scopeOff = element.scope().$on('$destroy', hideBubble);

            return {
                /**
                 * Detach any event handlers associated with this gesture.
                 * @memberof InfoGesture
                 * @method
                 */
                destroy: function () {
                    // Dismiss any active bubble...
                    hideBubble();
                    // ...and detach listeners
                    element.off('mouseenter', showBubble);
                    scopeOff();
                }
            };
        }

        return InfoGesture;

    }

);
