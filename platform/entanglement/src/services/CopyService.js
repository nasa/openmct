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
    ["../../../commonUI/browse/lib/uuid"],
    function (uuid) {
        "use strict";

        /**
         * CopyService provides an interface for deep copying objects from one
         * location to another.  It also provides a method for determining if
         * an object can be copied to a specific location.
         * @constructor
         * @memberof platform/entanglement
         * @implements {platform/entanglement.AbstractComposeService}
         */
        function CopyService($q, creationService, policyService) {
            this.$q = $q;
            this.creationService = creationService;
            this.policyService = policyService;
        }

        CopyService.prototype.validate = function (object, parentCandidate) {
            if (!parentCandidate || !parentCandidate.getId) {
                return false;
            }
            if (parentCandidate.getId() === object.getId()) {
                return false;
            }
            return this.policyService.allow(
                "composition",
                parentCandidate.getCapability('type'),
                object.getCapability('type')
            );
        };
        
        /**
         * Will build a graph of an object and all of its composed objects in memory
         * @private
         * @param domainObject
         */
        function buildCopyGraph(domainObject, parent) {
            var clonedModels = [];
            
            function clone(object) {
                return JSON.parse(JSON.stringify(object));
            }
            
            function copy(object, parent) {
                var modelClone = clone(object.getModel());
                modelClone.composition = [];
                if (domainObject.hasCapability('composition')) {
                    return domainObject.useCapability('composition').then(function(composees){
                        return composees.reduce(function(promise, composee){
                            return promise.then(function(){
                                return copy(composee, object).then(function(composeeClone){
                                    /*
                                    TODO: Use the composition capability for this. Just not sure how to contextualize the as-yet non-existent modelClone object.
                                     */
                                    return modelClone.composition.push(composeeClone.id);
                                });
                            });
                        }, $q.when(undefined)).then(function (){
                            modelClone.id = uuid();
                            clonedModels.push(modelClone);
                            return modelClone;
                        });
                    });
                } else {
                    return Q.when(modelClone);
                }
            };
            return copy(domainObject, parent).then(function(){
                return clonedModels;
            });
        }

        function newPerform (domainObject, parent) {
            return buildCopyGraph.then(function(clonedModels){
                return clonedModels.reduce(function(promise, clonedModel){
                    /*
                    TODO: Persist the clone. We need to bypass the creation service on this because it wants to create the composition along the way, which we want to avoid. The composition has already been done directly in the model.
                     */
                }, this.q.when(undefined));
            })
        }

        CopyService.prototype.perform = oldPerform;
        
        function oldPerform (domainObject, parent) {
            var model = JSON.parse(JSON.stringify(domainObject.getModel())),
                $q = this.$q,
                self = this;

            // Wrapper for the recursive step
            function duplicateObject(domainObject, parent) {
                return self.perform(domainObject, parent);
            }

            if (!this.validate(domainObject, parent)) {
                throw new Error(
                    "Tried to copy objects without validating first."
                );
            }

            if (domainObject.hasCapability('composition')) {
                model.composition = [];
            }

            /*
             * 1) Traverse to leaf of object tree
             * 2) Copy object and persist
             * 3) Go up to parent
             * 4) Update parent in memory with new composition
             * 4) If parent has more children
             * 5)     Visit next child
             * 6)     Go to 2)
             * 7) else
             * 8)      Persist parent
             */
            
            /*
             * copy(object, parent) {
             * 1)    objectClone = clone(object);  // Clone object
             * 2)    objectClone.composition = []; // Reset the clone's composition
             * 3)    composees = object.composition;
             * 3)    composees.reduce(function (promise, composee) { // For each child in original composition
             * 4)        return promise.then(function () {
             * 5)            return copy(composee, object).then(function(clonedComposee){
             * 6)               objectClone.composition.push(clonedComposee);
             * 7)               return objectClone;
             * 8)            ); // Copy the child
             * 9)        };
             * 10)    })
             * 11)   objectClone.id = newId();
             * 12)   return persist(objectClone);
             * }
             */

            return this.creationService
                .createObject(model, parent)
                .then(function (newObject) {
                    if (!domainObject.hasCapability('composition')) {
                        return;
                    }

                    return domainObject
                        .useCapability('composition')
                        .then(function (composees) {
                            // Duplicate composition serially to prevent
                            // write conflicts.
                            return composees.reduce(function (promise, composee) {
                                return promise.then(function () {
                                    return duplicateObject(composee, newObject);
                                });
                            }, $q.when(undefined));
                        });
                });
        };

        return CopyService;
    }
);

