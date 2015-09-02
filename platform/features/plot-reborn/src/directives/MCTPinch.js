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

        function MCTPinch(agentService) {

            /*
             * Links the attributes with the
             * provided link function and nested
             * touch event functions
             */
            function link($scope, element) {

                // isPan and isPinch variables are set after the start
                // of a gestures and is checked over the change of that
                // gesture. These are used to differentiate gestures and
                // force only one type of gesture to be done at a time
                var isPan = false,
                    isPinch = false;

                // Returns position of touch event
                function trackPosition(event) {
                    return {
                        clientX: event.clientX,
                        clientY: event.clientY
                    };
                }

                // Calculates the midpoint between two given
                // coordinates and returns it as coordinate object
                function calculateMidpoint(coordOne, coordTwo) {
                    return {
                        clientX: (coordOne.clientX + coordTwo.clientX) / 2,
                        clientY: (coordOne.clientY + coordTwo.clientY) / 2
                    };
                }

                // Calculates the distance between two coordinates
                // and returns as number/integer value
                function calculateDistance(coordOne, coordTwo) {
                    return Math.sqrt(Math.pow(coordOne.clientX - coordTwo.clientX, 2) +
                        Math.pow(coordOne.clientY - coordTwo.clientY, 2));
                }

                // Checks if the user is going to pan by checking the number
                // of touches on the screen (one touch means pan)
                function checkPan(event) {
                    return (event.changedTouches.length === 1) ||
                        (event.touches.length === 1);
                }

                // Checks if the user is going to pinch by checking the number
                // of touches on the screen (two touches means pinch)
                function checkPinch(event) {
                    return (event.changedTouches.length === 2) ||
                        (event.touches.length === 2);
                }

                // On touch start the 'touch' is tracked and
                // the event is emitted through scope
                function touchStart(event) {
                    var touchPosition;

                    // If two touches or change touches are occurring
                    // than user is doing a pinch gesture
                    if (checkPinch(event)) {

                        // User has started pinch, sets isPinch and resets isPan
                        isPan = false;
                        isPinch = true;

                        // Position of both touches are tracked and saved in variable
                        touchPosition = [trackPosition(event.touches[0]),
                            trackPosition(event.touches[1])];

                        // Emits the start of the pinch and passes the
                        // touch coordinates (touches), the bounds of the
                        // event, the midpoint of both touch coorddinates,
                        // and the distance between the two touch coordinates
                        $scope.$emit('mct:pinch:start', {
                            touches: touchPosition,
                            bounds: event.target.getBoundingClientRect(),
                            midpoint: calculateMidpoint(touchPosition[0], touchPosition[1]),
                            distance: calculateDistance(touchPosition[0], touchPosition[1])
                        });
                        
                        // Stops other gestures/button clicks from being active
                        event.preventDefault();

                    }
                    // If one touch or change touch is occurring
                    // user is doing a single finger pan gesture
                    else if (checkPan(event)) {

                        // User has started pan, sets isPan and resets isPinch
                        isPinch = false;
                        isPan = true;

                        // Position of single touch is tracked and
                        // saved in variable
                        touchPosition = trackPosition(event.touches[0]);

                        // Emits the start of the pan and passes the
                        // touch coordinates (touch), and the bounds
                        // of the event
                        $scope.$emit('mct:pan:start', {
                            touch: touchPosition,
                            bounds: event.target.getBoundingClientRect()
                        });
                        
                        // Stops other gestures/button clicks from being active
                        event.preventDefault();
                    }
                }

                // As the touch move occurs, the touches are tracked and
                // the event is emitted through scope
                function touchChange(event) {
                    var touchPosition;

                    // If two touches or change touches are occurring
                    // and the user has started a pinch than user is
                    // doing a pinch gesture
                    if (checkPinch(event) && isPinch) {

                        // Position of both touches are tracked and saved in variable. If change
                        // in touch of either coordinate is undefined, uses touch instead
                        touchPosition = [trackPosition(event.changedTouches[0] || event.touches[0]),
                            trackPosition(event.changedTouches[1] || event.touches[1])];

                        // Emits the change in pinch and passes the
                        // touch coordinates (touches), the bounds of the
                        // event, the midpoint of both touch coorddinates,
                        // and the distance between the two touch coordinates
                        $scope.$emit('mct:pinch:change', {
                            touches: touchPosition,
                            bounds: event.target.getBoundingClientRect(),
                            midpoint: calculateMidpoint(touchPosition[0], touchPosition[1]),
                            distance: calculateDistance(touchPosition[0], touchPosition[1])
                        });
                        
                        // Stops other gestures/button clicks from being active
                        event.preventDefault();
                    }
                    // If one touch or change touch is occurring
                    // user is doing a single finger pan gesture
                    else if (checkPan(event) && isPan) {

                        // Position of single changed touch or touch is tracked and saved in variable
                        touchPosition = trackPosition(event.changedTouches[0] || event.touches[0]);

                        // Emits the change of the pan and passes the
                        // touch coordinates (touch), and the bounds
                        // of the event
                        $scope.$emit('mct:pan:change', {
                            touch: touchPosition,
                            bounds: event.target.getBoundingClientRect()
                        });

                        // Stops other gestures/button clicks from being active
                        event.preventDefault();
                    }
                }

                // On the 'touchend' or 'touchcancel' the event
                // is emitted through scope
                function touchEnd(event) {

                    // Emits that this is the end of the touch
                    $scope.$emit('mct:ptouch:end');

                    // set pan/pinch statuses to false
                    // when the user stops touching the screen
                    isPan = false;
                    isPinch = false;

                    // Stops other gestures/button clicks from being active
                    event.preventDefault();
                }

                // On Mobile, checks for touch start, move, and end/cancel
                if (agentService.isMobile(navigator.userAgent)) {
                    element.on('touchstart', touchStart);
                    element.on('touchmove', touchChange);
                    element.on('touchend', touchEnd);
                    element.on('touchcancel', touchEnd);
                }

                // Stop checking for touch when scope is destroyed
                // (when user navigates away from graph).
                $scope.$on("$destroy", function () {

                    // All elements' event listeners are
                    // removed
                    element.off('touchstart', touchStart);
                    element.off('touchmove', touchChange);
                    element.off('touchend', touchEnd);
                    element.off('touchcancel', touchEnd);

                    // If for some reason, midtouch the
                    // user is navigated away, set pan/pinch
                    // statuses to false
                    isPan = false;
                    isPinch = false;
                });
            }

            return {
                // MCTPinch is treated as an attribute
                restrict: "A",

                // Link with the provided function above
                link: link
            };
        }

        return MCTPinch;

    }
);