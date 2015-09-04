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

/**
 * Module defining MessagesViewPolicy. Created by shale on 06/24/2015.
 */
define(
    [],
    function () {
        "use strict";

        /**
         * Policy controlling when the real time Messages view should be avaliable.
         * @memberof platform/features/rtevents
         * @constructor
         */
        function RTMessagesViewPolicy() {
            
            function hasStringTelemetry(domainObject) {
                var telemetry = domainObject &&
                        domainObject.getCapability('telemetry'),
                    metadata = telemetry ? telemetry.getMetadata() : {},
                    ranges = metadata.ranges || [];
                
                return ranges.some(function (range) {
                    return range.format === 'string';
                });
            }
            return {
                /**
                 * Check whether or not a given action is allowed by this
                 * policy.
                 * @param {Action} action the action
                 * @param domainObject the domain object which will be viewed
                 * @returns {boolean} true if not disallowed
                 * @memberof platform/features/rtevents.RTMessagesViewPolicy#
                 */
                allow: function (view, domainObject) {
                    // This policy only applies for the RT Messages view
                    if (view.key === 'rtmessages') {
                        // The Messages view is allowed only if the domain 
                        // object has string telemetry
                        if (!hasStringTelemetry(domainObject)) {
                            return false;
                        }
                    }
                    
                    // Like all policies, allow by default.
                    return true;
                }
            };
        }

        return RTMessagesViewPolicy;
    }
);
