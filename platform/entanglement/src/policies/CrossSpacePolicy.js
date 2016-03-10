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
    [],
    function () {
        'use strict';

        var DISALLOWED_ACTIONS = [
            "move",
            "copy"
        ];

        /**
         * This policy prevents performing move/copy/link actions across
         * different persistence spaces (e.g. linking to an object in
         * a private space from an object in a public space.)
         * @memberof {platform/entanglement}
         * @constructor
         * @implements {Policy}
         */
        function CrossSpacePolicy() {
        }

        function lookupSpace(domainObject) {
            var persistence = domainObject &&
                domainObject.getCapability("persistence");
            return persistence && persistence.getSpace();
        }

        function isCrossSpace(context) {
            var domainObject = context.domainObject,
                selectedObject = context.selectedObject,
                spaces = [ domainObject, selectedObject ].map(lookupSpace);
            return selectedObject !== undefined &&
                domainObject !== undefined &&
                lookupSpace(domainObject) !== lookupSpace(selectedObject);
        }

        CrossSpacePolicy.prototype.allow = function (action, context) {
            var key = action.getMetadata().key;

            if (DISALLOWED_ACTIONS.indexOf(key) !== -1) {
                return !isCrossSpace(context);
            }

            return true;
        };

        return CrossSpacePolicy;

    }
);
