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

        function MCTPinch($log, agentService) {
            
            function link($scope, element, attrs) {
                var posPrev,
                    evePrev;
                
                // Returns position of touch event
                function trackPosition(event) {
                    return [event.clientX, event.clientY];
                }
                
                // On touch start the 'touch' is tracked and
                // the event is emitted through scope
                function pinchStart(event) {
                    if (event.changedTouches.length === 2 ||
                            event.touches.length === 2) {
                        var touchPosition = [trackPosition(event.touches[0]),
                                             trackPosition(event.touches[1])],
                            touchPositionPrev = posPrev || touchPosition,
                            eventPrev = evePrev || event;
                        
                        $scope.$emit('mct:pinch:start');
                        // Set current position to be previous position 
                        // for next touch action
                        posPrev = touchPosition;
                        
                        // Set current event to be previous event 
                        // for next touch action
                        evePrev = event;
                        
                        // Stops other gestures/button clicks from being active
                        event.preventDefault();
                    }
                }
                
                // As the touch move occurs, the touches are tracked and
                // the event is emitted through scope
                function pinchChange(event) {
                    if (event.changedTouches.length === 2) {
                        var touchPosition = [trackPosition(event.changedTouches[0]),
                                             trackPosition(event.changedTouches[1])],
                            touchPositionPrev = posPrev || touchPosition,
                            eventPrev = evePrev || event;
                        
                        $scope.$emit('mct:pinch:change');
                        // Set current position to be previous position 
                        // for next touch action
                        posPrev = touchPosition;
                        
                        // Set current event to be previous event 
                        // for next touch action
                        evePrev = event;
                        
                        // Stops other gestures/button clicks from being active
                        event.preventDefault();
                    }
                }
                
                // On the 'touchend' or 'touchcancel' the event
                // is emitted through scope
                function pinchEnd(event) {
                        $scope.$emit('mct:pinch:end');
                        
                        // Stops other gestures/button clicks from being active
                        event.preventDefault();
                }
                
                if (agentService.isMobile(navigator.userAgent)) {
                    element.on('touchstart', pinchStart);
                    element.on('touchmove', pinchChange);
                    element.on('touchend', pinchEnd);
                    element.on('touchcancel', pinchEnd);
                }
                
                // Stop checking for resize when scope is destroyed
//                $scope.$on("$destroy", destroyEverythingNow);
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