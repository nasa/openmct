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
    ["uuid"],
    function (uuid) {
        "use strict";

        function CopyTask (domainObject, parent, persistenceService, $q, now){
            this.domainObject = domainObject;
            this.parent = parent;
            this.$q = $q;
            this.deferred = undefined;
            this.persistenceService = persistenceService;
            this.persisted = 0;
            this.now = now;
        }

        /**
         * Will persist a list of {@link objectClones}. It will persist all
         * simultaneously, irrespective of order in the list. This may
         * result in automatic request batching by the browser.
         * @private
         */
        CopyTask.prototype.persistObjects = function(objectClones) {
            var self = this;

            return this.$q.all(objectClones.map(function(clone){
                clone.model.persisted = self.now();
                return self.persistenceService.createObject(clone.persistenceSpace, clone.id, clone.model)
                    .then(function(){
                        return self.deferred.notify({phase: "copying", totalObjects: objectClones.length, processed: ++persisted});
                    });
            })).then(function(){
                return objectClones;
            });
        };

        /**
         * Will add a list of clones to the specified parent's composition
         * @private
         */
        CopyTask.prototype.addClonesToParent = function(clones) {
            var parentClone = clones[clones.length-1],
                self = this;

            if (!this.parent.hasCapability('composition')){
                return this.deferred.reject();
            }

            return this.persistenceService
                .updateObject(parentClone.persistenceSpace, parentClone.id, parentClone.model)
                .then(function(){return self.parent.getCapability("composition").add(parentClone.id);})
                .then(function(){return self.parent.getCapability("persistence").persist();})
                .then(function(){return parentClone;});
            // Ensure the clone of the original domainObject is returned
        };

        /**
         * Will build a graph of an object and all of its child objects in
         * memory
         * @private
         * @param domainObject The original object to be copied
         * @param parent The parent of the original object to be copied
         * @returns {Promise} resolved with an array of clones of the models
         * of the object tree being copied. Copying is done in a bottom-up
         * fashion, so that the last member in the array is a clone of the model
         * object being copied. The clones are all full composed with
         * references to their own children.
         */
        CopyTask.prototype.buildCopyPlan = function() {
            var clones = [],
                $q = this.$q,
                self = this;

            function makeClone(object) {
                return JSON.parse(JSON.stringify(object));
            }

            /**
             * A recursive function that will perform a bottom-up copy of
             * the object tree with originalObject at the root. Recurses to
             * the farthest leaf, then works its way back up again,
             * cloning objects, and composing them with their child clones
             * as it goes
             * @param originalObject
             * @param originalParent
             * @returns {*}
             */
            function copy(originalObject, originalParent) {
                //Make a clone of the model of the object to be copied
                var modelClone = {
                    id: uuid(),
                    model: makeClone(originalObject.getModel()),
                    persistenceSpace: originalParent.hasCapability('persistence') && originalParent.getCapability('persistence').getSpace()
                };

                delete modelClone.model.composition;
                delete modelClone.model.persisted;
                delete modelClone.model.modified;

                return $q.when(originalObject.useCapability('composition')).then(function(composees){
                    self.deferred.notify({phase: "preparing"});
                    return (composees || []).reduce(function(promise, composee){
                            //If the object is composed of other
                            // objects, chain a promise..
                            return promise.then(function(){
                                // ...to recursively copy it (and its children)
                                return copy(composee, originalObject).then(function(composeeClone){
                                    //Once copied, associate each cloned
                                    // composee with its parent clone
                                    composeeClone.model.location = modelClone.id;
                                    modelClone.model.composition = modelClone.model.composition || [];
                                    return modelClone.model.composition.push(composeeClone.id);
                                });
                            });}, $q.when(undefined)
                    ).then(function (){
                            //Add the clone to the list of clones that will
                            //be returned by this function
                            clones.push(modelClone);
                            return modelClone;
                        });
                });
            }

            return copy(self.domainObject, self.parent).then(function(domainObjectClone){
                domainObjectClone.model.location = parent.getId();
                return clones;
            });
        };

        CopyTask.prototype.perform = function(){
            var persistObjects = this.persistObjects.bind(this),
                addClonesToParent = this.addClonesToParent.bind(this);

            this.deferred = this.$q.defer();

            return this.buildCopyPlan()
                .then(persistObjects)
                .then(addClonesToParent)
                .then(this.deferred.resolve)
                .catch(this.deferred.reject);
        }

        return CopyTask;
    }
);