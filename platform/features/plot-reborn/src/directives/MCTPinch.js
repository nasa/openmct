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
            
            function link($scope, element) {
                // Returns position of touch event
                function trackPosition(event) {
                    return {
                        clientX: event.clientX,
                        clientY: event.clientY
                    };
                }

                // Calculates the midpoint between two given
                // coordinates
                function calculateMidpoint(coordOne, coordTwo) {
                    return {
                        clientX: (coordOne.clientX + coordTwo.clientX) / 2,
                        clientY: (coordOne.clientY + coordTwo.clientY) / 2
                    };
                }

                // Calculates the distance between two coordinates
                function calculateDistance(coordOne, coordTwo) {
                    return Math.sqrt(Math.pow(coordOne.clientX - coordTwo.clientX, 2) +
                        Math.pow(coordOne.clientY - coordTwo.clientY, 2));
                }

                // On touch start the 'touch' is tracked and
                // the event is emitted through scope
                function touchStart(event) {
                    var touchPosition;

                    if (event.changedTouches.length === 2 ||
                            event.touches.length === 2) {
                        //console.log("PINCH START");
                        touchPosition = [trackPosition(event.touches[0]),
                            trackPosition(event.touches[1])];
                        
                        $scope.$emit('mct:pinch:start', {
                            touches: touchPosition,
                            bounds: event.target.getBoundingClientRect(),
                            midpoint: calculateMidpoint(touchPosition[0], touchPosition[1]),
                            distance: calculateDistance(touchPosition[0], touchPosition[1])
                        });
                        
                        // Stops other gestures/button clicks from being active
                        event.preventDefault();
                    } else if (event.changedTouches.length === 1 ||
                            event.touches.length === 1) {
                        //console.log("*PAN START");
                        touchPosition = trackPosition(event.touches[0]);
                        
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

                    if (event.changedTouches.length === 2 ||
                        event.touches.length === 2) {
                        //console.log("PINCH CHANGE");
                        touchPosition = [trackPosition(event.changedTouches[0] || event.touches[0]),
                            trackPosition(event.changedTouches[1] || event.touches[1])];
                        
                        $scope.$emit('mct:pinch:change', {
                            touches: touchPosition,
                            bounds: event.target.getBoundingClientRect(),
                            midpoint: calculateMidpoint(touchPosition[0], touchPosition[1]),
                            distance: calculateDistance(touchPosition[0], touchPosition[1])
                        });
                        
                        // Stops other gestures/button clicks from being active
                        event.preventDefault();
                    } else if (event.changedTouches.length === 1 ||
                        event.touches.length === 1) {
                        //console.log("*PAN CHANGE");
                        touchPosition = trackPosition(event.changedTouches[0]);

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
                    $scope.$emit('mct:ptouch:end');

                    // Stops other gestures/button clicks from being active
                    event.preventDefault();
                }

                // On Mobile, checks for touch start, move, and end
                if (agentService.isMobile(navigator.userAgent)) {
                    element.on('touchstart', touchStart);
                    element.on('touchmove', touchChange);
                    element.on('touchend', touchEnd);
                    element.on('touchcancel', touchEnd);
                }

                // Stop checking for touch when scope is destroyed
                $scope.$on("$destroy", function () {
                    element.off('touchstart', touchStart);
                    element.off('touchmove', touchChange);
                    element.off('touchend', touchEnd);
                    element.off('touchcancel', touchEnd);
                });
            }

            return {
                restrict: "A",
                // Link with the provided function
                link: link
            };
        }

        return MCTPinch;

    }
);