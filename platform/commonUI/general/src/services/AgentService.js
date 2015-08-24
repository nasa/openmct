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
 * Module defining AgentService.
 */

define(
    [],
    function () {
        "use strict";

        /**
         * The query service handles calls for browser and userAgent
         * info using a comparison between the userAgent and key
         * device names
         */
        function AgentService() {
            
            // Gets the UA name if it is one of the following.
            // If it is not (a desktop for example) nothing is
            // returned instead
            function getDeviceUA(ua) {
                return ua.match(/iPad|iPhone|Android/i) ?
                        ua.match(/iPad|iPhone|Android/i) : "";
            }
            
            // Checks if gotten device is mobile,
            // Mobile is defined as a phone or tablet
            function isMobile(ua) {
                if (getDeviceUA(ua)) {
                    return true;
                } else {
                    return false;
                }
            }
            
            // Checks if device is phone,
            // phone is designated as only an
            // iPhone device
            function isPhone(ua) {
                if (getDeviceUA(ua)[0] === "iPhone") {
                    return true;
                } else {
                    return false;
                }
            }

            // Returns the orientation of the device based on the
            // device's window dimensions
            function getOrientation() {
                if (window.innerWidth > window.innerHeight) {
                    return "landscape";
                } else if (window.innerWidth < window.innerHeight) {
                    return "portrait";
                }
            }
         
            return {
                /**
                 * Returns the orientation for the user's device
                 */
                getOrientation: getOrientation,
                
                /**
                 * Returns the a boolean checking if the user is
                 * on a mobile or non-mobile device. (mobile: true,
                 * non-mobile: false)
                 */
                isMobile: isMobile,
                
                /**
                 * Returns the a boolean checking if the user is on
                 * a phone device. (phone: true, non-phone: false)
                 */
                isPhone: isPhone
            };
        }

        return AgentService;
    }
);