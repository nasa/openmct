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
         * MoveService provides an interface for moving objects from one
         * location to another.  It also provides a method for determining if
         * an object can be copied to a specific location.
         * @constructor
         * @memberof platform/entanglement
         * @implements {platform/entanglement.AbstractComposeService}
         */
        function MoveService(policyService, linkService) {
            this.policyService = policyService;
            this.linkService = linkService;
        }

        MoveService.prototype.validate = function (object, parentCandidate) {
            var currentParent = object
                .getCapability('context')
                .getParent();

            if (!parentCandidate || !parentCandidate.getId) {
                return false;
            }
            if (parentCandidate.getId() === currentParent.getId()) {
                return false;
            }
            if (parentCandidate.getId() === object.getId()) {
                return false;
            }
            if (parentCandidate.getModel().composition.indexOf(object.getId()) !== -1) {
                return false;
            }
            return this.policyService.allow(
                "composition",
                parentCandidate.getCapability('type'),
                object.getCapability('type')
            );
        };

        MoveService.prototype.perform = function (object, parentObject) {
            function relocate(objectInNewContext) {
                var newLocationCapability = objectInNewContext
                        .getCapability('location'),
                    oldLocationCapability = object
                        .getCapability('location');

                if (!newLocationCapability ||
                        !oldLocationCapability) {
                    return;
                }

                if (oldLocationCapability.isOriginal()) {
                    return newLocationCapability.setPrimaryLocation(
                        newLocationCapability
                            .getContextualLocation()
                    );
                }
            }

            if (!this.validate(object, parentObject)) {
                throw new Error(
                    "Tried to move objects without validating first."
                );
            }

            return this.linkService
                .perform(object, parentObject)
                .then(relocate)
                .then(function () {
                    return object
                        .getCapability('action')
                        .perform('remove');
                });
        };

        return MoveService;
    }
);

