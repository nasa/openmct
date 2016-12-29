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

define(
    [],
    () => {

        /**
         * The `info` gesture displays domain object metadata in a
         * bubble on hover.
         *
         * @memberof platform/commonUI/inspect
         * @constructor
         * @implements {Gesture}
         * @param $timeout Angular's `$timeout`
         * @param {InfoService} infoService a service which shows info bubbles
         * @param {number} delay delay, in milliseconds, before bubble appears
         * @param element jqLite-wrapped DOM element
         * @param {DomainObject} domainObject the domain object for which to
         *        show information
         */
        class InfoGesture {
          constructor($timeout, agentService, infoService, delay, element, domainObject) {
            // Callback functions to preserve the "this" pointer (in the
            // absence of Function.prototype.bind)
            this.showBubbleCallback = (event) => {
                this.showBubble(event);
            };
            this.hideBubbleCallback = (event) => {
                this.hideBubble(event);
            };
            this.trackPositionCallback = (event) => {
                this.trackPosition(event);
            };

            this.element = element;
            this.$timeout = $timeout;
            this.infoService = infoService;
            this.delay = delay;
            this.domainObject = domainObject;

            // Checks if you are on a mobile device, if the device is
            // not mobile (agentService.isMobile() = false), then
            // the pendingBubble and therefore hovering is allowed
            if (!agentService.isMobile()) {
                // Show bubble (on a timeout) on mouse over
                element.on('mouseenter', this.showBubbleCallback);
            }
        }

        trackPosition(event) {
            // Record mouse position, so bubble can be shown at latest
            // mouse position (not just where the mouse entered)
            this.mousePosition = [event.clientX, event.clientY];
        };

        hideBubble() {
            // If a bubble is showing, dismiss it
            if (this.dismissBubble) {
                this.dismissBubble();
                this.element.off('mouseleave', this.hideBubbleCallback);
                this.dismissBubble = undefined;
            }
            // If a bubble will be shown on a timeout, cancel that
            if (this.pendingBubble) {
                this.$timeout.cancel(this.pendingBubble);
                this.element.off('mousemove', this.trackPositionCallback);
                this.element.off('mouseleave', this.hideBubbleCallback);
                this.pendingBubble = undefined;
            }
            // Also clear mouse position so we don't have a ton of tiny
            // arrays allocated while user mouses over things
            this.mousePosition = undefined;
        };

        showBubble(event) {

            const displayBubble = () => {
                this.dismissBubble = this.infoService.display(
                    "info-table",
                    this.domainObject.getModel().name,
                    this.domainObject.useCapability('metadata'),
                    this.mousePosition
                );
                this.element.off('mousemove', this.trackPositionCallback);
                this.pendingBubble = undefined;
            }

            this.trackPosition(event);

            // Do nothing if we're already scheduled to show a bubble.
            // This may happen due to redundant event firings caused
            // by https://github.com/angular/angular.js/issues/12795
            if (this.pendingBubble) {
                return;
            }

            // Also need to track position during hover
            this.element.on('mousemove', this.trackPositionCallback);

            // Show the bubble, after a suitable delay (if mouse has
            // left before this time is up, this will be canceled.)
            this.pendingBubble = this.$timeout(displayBubble, this.delay);

            this.element.on('mouseleave', this.hideBubbleCallback);
        };


        /**
         * Detach any event handlers associated with this gesture.
         * @method
         */
        destroy() {
            // Dismiss any active bubble...
            this.hideBubble();
            // ...and detach listeners
            this.element.off('mouseenter', this.showBubbleCallback);
        };
      }
        return InfoGesture;
    }

);

