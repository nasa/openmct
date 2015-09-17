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

define(
    ['../capabilities/ContextualDomainObject'],
    function (ContextualDomainObject) {
        "use strict";

        /**
         * Wrap a domain object such that it has a `context` capability
         * referring to a specific parent.
         *
         * Usage:
         *
         *     contextualize(domainObject, parentObject)
         *
         * Attempting to contextualize an object with a parent that does
         * not include that object in its composition may have
         * unpredictable results; a warning will be logged if this occurs.
         *
         * @returns {Function}
         * @memberof platform/core
         */
        function Contextualize($log) {
            function validate(id, parentObject) {
                var model = parentObject && parentObject.getModel(),
                    composition = (model || {}).composition || [];
                if (composition.indexOf(id) === -1) {
                    $log.warn([
                        "Attempted to contextualize",
                        id,
                        "in",
                        parentObject && parentObject.getId(),
                        "but that object does not contain",
                        id,
                        "in its composition.",
                        "Unexpected behavior may follow."
                    ].join(" "));
                }
            }

            /**
             * Contextualize this domain object.
             * @param {DomainObject} domainObject the domain object
             *        to wrap with a context
             * @param {DomainObject} parentObject the domain object
             *        which should appear as the contextual parent
             */
            return function (domainObject, parentObject) {
                validate(domainObject.getId(), parentObject);
                return new ContextualDomainObject(domainObject, parentObject);
            };
        }

        return Contextualize;
    }
);

