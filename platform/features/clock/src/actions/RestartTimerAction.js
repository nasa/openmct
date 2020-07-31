/*****************************************************************************
 * Open MCT, Copyright (c) 2009-2016, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT is licensed under the Apache License, Version 2.0 (the
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
 * Open MCT includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/

define(
    [],
    function () {

        /**
         * Implements the "Restart at 0" action.
         *
         * Behaves the same as (and delegates functionality to)
         * the "Start" action.
         *
         * @implements {Action}
         * @memberof platform/features/clock
         * @constructor
         * @param {Function} now a function which returns the current
         *        time (typically wrapping `Date.now`)
         * @param {ActionContext} context the context for this action
         */
        function RestartTimerAction(now, context) {
            this.domainObject = context.domainObject;
            this.now = now;
        }

        RestartTimerAction.appliesTo = function (context) {
            var model =
                (context.domainObject && context.domainObject.getModel())
                || {};

            // We show this variant for timers which already have a target time.
            return model.type === 'timer'
                && model.timerState !== 'stopped';
        };

        RestartTimerAction.prototype.perform = function () {
            var domainObject = this.domainObject,
                now = this.now;

            function updateModel(model) {
                model.timestamp = now();
                model.timerState = 'started';
                model.pausedTime = undefined;
            }

            return domainObject.useCapability('mutation', updateModel);
        };

        return RestartTimerAction;
    }
);
