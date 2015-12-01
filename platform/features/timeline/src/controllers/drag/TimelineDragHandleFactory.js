/*****************************************************************************
 * Open MCT Web, Copyright (c) 2009-2015, United States Government
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
    ['./TimelineStartHandle', './TimelineEndHandle', './TimelineMoveHandle'],
    function (TimelineStartHandle, TimelineEndHandle, TimelineMoveHandle) {
        "use strict";


        var DEFAULT_HANDLES = [
                TimelineStartHandle,
                TimelineMoveHandle,
                TimelineEndHandle
            ],
            TIMELINE_HANDLES = [
                TimelineStartHandle,
                TimelineMoveHandle
            ];

        /**
         * Create a factory for drag handles for timelines/activities
         * in a timeline view.
         * @constructor
         */
        function TimelineDragHandleFactory(dragHandler, snapHandler) {
            return {
                /**
                 * Create drag handles for this domain object.
                 * @param {DomainObject} domainObject the object to be
                 *        manipulated by these gestures
                 * @returns {Array} array of drag handles
                 */
                handles: function (domainObject) {
                    var type = domainObject.getCapability('type'),
                        id = domainObject.getId();

                    // Instantiate a handle
                    function instantiate(Handle) {
                        return new Handle(
                            id,
                            dragHandler,
                            snapHandler
                        );
                    }

                    // Instantiate smaller set of handles for timelines
                    return (type && type.instanceOf('timeline') ?
                            TIMELINE_HANDLES : DEFAULT_HANDLES)
                                    .map(instantiate);
                }
            };
        }

        return TimelineDragHandleFactory;
    }
);
