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
 * Module defining DragGesture. Created by vwoeltje on 11/17/14.
 */
define(
    ['./GestureConstants'],
    function (GestureConstants) {
        "use strict";

        /**
         * Add event handlers to a representation such that it may be
         * dragged as the source for drag-drop composition.
         *
         * @constructor
         * @param $log Angular's logging service
         * @param element the jqLite-wrapped element which should become
         *        draggable
         * @param {DomainObject} domainObject the domain object which
         *        is represented; this will be passed on drop.
         */
        function PinchGesture($log, agentService, element, domainObject) {
            // Gets name of current domainobject
            var currentObjectName = domainObject.getCapability('type').getName();
            
            function trackPosition(event) {
                return [event.clientX, event.clientY];
            }
            
            function calculateDistance(coordOne, coordTwo) {
                var squareX = Math.pow(coordOne[0] - coordTwo[0], 2),
                    squareY = Math.pow(coordOne[1] - coordTwo[1], 2);
                return Math.sqrt(squareX + squareY);
            }
            
            function pinchAction(event) {
                if (event.changedTouches.length === 2) {
                    var touchPosOne = trackPosition(event.changedTouches[0]),
                        touchPosTwo = trackPosition(event.changedTouches[1]),
                        distance = calculateDistance(touchPosOne, touchPosTwo);
                    
                    $log.warn("PINCH DIST: " + distance);
                    
                    event.preventDefault();
                }
            }
            
            if (agentService.isMobile(navigator.userAgent) && currentObjectName !== "Folder") {
                element.on('touchstart', pinchAction);
                element.on('touchmove', pinchAction);
                element.on('touchend', pinchAction);
            }
            return {
/**
                 * Detach any event handlers associated with this gesture.
                 * @method
                 * @memberof PinchGesture
                 */
                destroy: function () {
                    element.off('touchstart', pinchAction);
                    element.off('touchmove', pinchAction);
                    element.off('touchend', pinchAction);
                    element.unbind('touchstart');
                    element.unbind('touchmove');
                    element.unbind('touchend');
                }
            };
        }

        return PinchGesture;
    }
);