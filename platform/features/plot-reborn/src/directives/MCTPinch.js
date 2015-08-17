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
                
                function pinchAction(event) {
                    if (event.changedTouches.length === 2) {
                        var touchPosition = [trackPosition(event.changedTouches[0]),
                                             trackPosition(event.changedTouches[1])],
                            touchPositionPrev = posPrev || touchPosition,
                            eventPrev = evePrev || event;
                        
                        $scope.$emit('mct:pinch:action', event);
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
                
                if (agentService.isMobile(navigator.userAgent)) {
                    element.on('touchstart', pinchAction);
                    element.on('touchmove', pinchAction);
                    element.on('touchend', pinchAction);
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