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

define(
    function () {
        'use strict';

        var DEVICE_MATCHERS = {
            mobile: function (agentService) {
                return agentService.isMobile();
            },
            phone: function (agentService) {
                return agentService.isPhone();
            },
            tablet: function (agentService) {
                return agentService.isTablet();
            },
            desktop: function (agentService) {
                return !agentService.isMobile();
            },
            portrait: function (agentService) {
                return agentService.isPortrait();
            },
            landscape: function (agentService) {
                return agentService.isLandscape();
            }
        };


        /**
         * The `mct-device` directive, when applied as an attribute,
         * only includes the element when the device being used matches
         * a set of characteristics required.
         *
         * Required characteristics are given as space-separated strings
         * as the value to this attribute, e.g.:
         *
         *    <span mct-device="mobile portrait">Hello world!</span>
         *
         * ...will only show Hello world! when viewed on a mobile device
         * in the portrait orientation.
         *
         * Valid device characteristics to detect are:
         *
         * * `mobile`: Phones or tablets.
         * * `phone`: Phones specifically.
         * * `tablet`: Tablets specifically.
         * * `desktop`: Non-mobile devices.
         * * `portrait`: Devices in a portrait-style orientation.
         * * `landscape`: Devices in a landscape-style orientation.
         *
         * @param {AgentService} agentService used to detect device type
         *        based on information about the user agent
         */
        function MCTDevice(agentService) {

            function deviceMatches(tokens) {
                tokens = tokens || "";
                return tokens.split(" ").every(function (token) {
                    var fn = DEVICE_MATCHERS[token];
                    return fn && fn(agentService);
                });
            }

            function link(scope, element, attrs, ctrl, transclude) {
                if (deviceMatches(attrs.mctDevice)) {
                    transclude(function (clone) {
                        element.parent().append(clone);
                    });
                }
            }

            return {
                link: link,
                // We are transcluding the whole element (like ng-if)
                transclude: 'element',
                // Only apply as an attribute
                restrict: "A"
            };
        }

        return MCTDevice;
    }
);
