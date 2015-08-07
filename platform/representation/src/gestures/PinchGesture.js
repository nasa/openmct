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
            var touchOneX,
                touchOneY,
                touchTwoX,
                touchTwoY,
                distance;
            
            function trackTouchOne(event) {
                if (event) {
                    touchOneX = event.clientX;
                    touchOneY = event.clientY;
                }
            }
            
            function trackTouchTwo(event) {
                if (event) {
                    touchTwoX = event.clientX;
                    touchTwoY = event.clientY;
                }
            }
            
            function findDistance() {
                var squareX = Math.pow(touchOneX - touchTwoX, 2),
                    squareY = Math.pow(touchOneY - touchTwoY, 2);
//                $log.warn(" MATHSQRT(" + squareX + " + " + squareY + ")");
                return Math.sqrt(squareX + squareY);
            }
            
            function pinchStartAction(event) {
                if (event.changedTouches.length === 2) {
                    trackTouchOne(event.changedTouches[0]);
                    trackTouchTwo(event.changedTouches[1]);
                    
                    var distance = findDistance();
                    
                    $log.warn("START DIST: " + distance);
                    
                    event.preventDefault();
                }
            }
            
            function pinchMoveAction(event) {
                if (event.changedTouches.length === 2) {
                    trackTouchOne(event.changedTouches[0]);
                    trackTouchTwo(event.changedTouches[1]);
                    
                    var distance = findDistance();
                    $log.warn("MOVE DIST: " + distance);
                    
                    event.preventDefault();
                }
            }
            function pinchEndAction(event) {
                if (event.changedTouches.length === 2) {
                    trackTouchOne(event.changedTouches[0]);
                    trackTouchTwo(event.changedTouches[1]);
                    
                    var distance = findDistance();
                    $log.warn("END DIST: " + distance);
                    
                    event.preventDefault();
                }
            }
            // Need to start the touch, transition to a touch move,
            // Then capture the coordinates during every single touch 
            // move, updating as movement is done. Keep in mind it is
            // two different touches, and therefore 2 sets of coordinates
            // Having these two sets allows manipulation and we can also take
            // the distance between them and find the difference to then scale and
            // accomplish pinch to zoom properly.
            if (agentService.isMobile(navigator.userAgent)) {
                element.on('touchstart', pinchStartAction);
                element.on('touchmove', pinchMoveAction);
                element.on('touchend', pinchEndAction);
            }
            return {

            };
        }

        return PinchGesture;
    }
);