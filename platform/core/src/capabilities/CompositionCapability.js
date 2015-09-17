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
 * Module defining CompositionCapability. Created by vwoeltje on 11/7/14.
 */
define(
    function () {
        "use strict";

        /**
         * Composition capability. A domain object's composition is the set of
         * domain objects it contains. This is available as an array of
         * identifiers in the model; the composition capability makes this
         * available as an array of domain object instances, which may
         * require consulting the object service (e.g. to trigger a database
         * query to retrieve the nested object models.)
         *
         * @memberof platform/core
         * @constructor
         * @implements {Capability}
         */
        function CompositionCapability($injector, contextualize, domainObject) {
            // Get a reference to the object service from $injector
            this.injectObjectService = function () {
                this.objectService = $injector.get("objectService");
            };

            this.contextualize = contextualize;
            this.domainObject = domainObject;
        }

        /**
         * Request the composition of this object.
         * @returns {Promise.<DomainObject[]>} a list of all domain
         *     objects which compose this domain object.
         */
        CompositionCapability.prototype.invoke = function () {
            var domainObject = this.domainObject,
                model = domainObject.getModel(),
                contextualize = this.contextualize,
                ids;

            // Then filter out non-existent objects,
            // and wrap others (such that they expose a
            // "context" capability)
            function contextualizeObjects(objects) {
                return ids.filter(function (id) {
                    return objects[id];
                }).map(function (id) {
                    return contextualize(objects[id], domainObject);
                });
            }

            // Lazily acquire object service (avoids cyclical dependency)
            if (!this.objectService) {
                this.injectObjectService();
            }

            // Make a new request if we haven't made one, or if the
            // object has been modified.
            if (!this.lastPromise || this.lastModified !== model.modified) {
                ids = model.composition || [];
                this.lastModified = model.modified;
                // Load from the underlying object service
                this.lastPromise = this.objectService.getObjects(ids)
                    .then(contextualizeObjects);
            }

            return this.lastPromise;
        };

        /**
         * Test to determine whether or not this capability should be exposed
         * by a domain object based on its model. Checks for the presence of
         * a composition field, that must be an array.
         * @param model the domain object model
         * @returns {boolean} true if this object has a composition
         */
        CompositionCapability.appliesTo = function (model) {
            return Array.isArray((model || {}).composition);
        };

        return CompositionCapability;
    }
);
