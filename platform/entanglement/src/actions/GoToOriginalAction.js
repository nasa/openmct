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

/*global define */
define(
    function () {
        "use strict";

        /**
         * Implements the "Go To Original" action, which follows a link back
         * to an original instance of an object.
         *
         * @implements {Action}
         * @constructor
         * @private
         * @memberof platform/entanglement
         * @param {ActionContext} context the context in which the action
         *        will be performed
         */
        function GoToOriginalAction(context) {
            this.domainObject = context.domainObject;
        }

        GoToOriginalAction.prototype.perform = function () {
            return this.domainObject.getCapability("location").getOriginal()
                .then(function (originalObject) {
                    var actionCapability =
                        originalObject.getCapability("action");
                    return actionCapability &&
                            actionCapability.perform("navigate");
                });
        };

        GoToOriginalAction.appliesTo = function (context) {
            var domainObject = context.domainObject;
            return domainObject && domainObject.hasCapability("location")
                && domainObject.getCapability("location").isLink();
        };

        return GoToOriginalAction;
    }
);

