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
    [],
    function () {
        "use strict";

        /**
         * Implements the "Start" and "Restart" action for timers.
         *
         * Sets the reference timestamp in a timer to the current
         * time, such that it begins counting up.
         *
         * Both "Start" and "Restart" share this implementation, but
         * control their visibility with different `appliesTo` behavior.
         *
         * @implements {Action}
         * @memberof platform/features/clock
         * @constructor
         * @param {Function} now a function which returns the current
         *        time (typically wrapping `Date.now`)
         * @param {ActionContext} context the context for this action
         */
        function AbstractStartTimerAction(now, context) {
            this.domainObject = context.domainObject;
            this.now = now;
        }

        AbstractStartTimerAction.prototype.perform = function () {
            var domainObject = this.domainObject,
                now = this.now;

            function doPersist() {
                var persistence = domainObject.getCapability('persistence');
                return persistence && persistence.persist();
            }

            function setTimestamp(model) {
                model.timestamp = now();
            }

            return domainObject.useCapability('mutation', setTimestamp)
                .then(doPersist);
        };

        return AbstractStartTimerAction;
    }
);
