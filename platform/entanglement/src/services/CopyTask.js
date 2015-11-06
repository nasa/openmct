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

        /**
         * This class encapsulates the process of copying a domain object
         * and all of its children.
         *
         * @param domainObject The object to copy
         * @param parent The new location of the cloned object tree
         * @param persistenceService
         * @param $q
         * @param now
         * @constructor
         */
        function CopyTask (domainObject, parent, persistenceService, $q, now){
            this.domainObject = domainObject;
            this.parent = parent;
            this.$q = $q;
            this.deferred = undefined;
            this.persistenceService = persistenceService;
            this.persisted = 0;
            this.now = now;
            this.clones = [];
        }

        function composeChild(child, parent) {
            //Once copied, associate each cloned
            // composee with its parent clone
            child.model.location = parent.id;
            parent.model.composition = parent.model.composition || [];
            return parent.model.composition.push(child.id);
        }

        function cloneObjectModel(objectModel) {
            var clone = JSON.parse(JSON.stringify(objectModel));

            delete clone.composition;
            delete clone.persisted;
            delete clone.modified;

            return clone;
        }

        /**
         * Will persist a list of {@link objectClones}. It will persist all
         * simultaneously, irrespective of order in the list. This may
         * result in automatic request batching by the browser.
         * @private
         */
        CopyTask.prototype.persistObjects = function() {
            var self = this;

            return this.$q.all(this.clones.map(function(clone){
                clone.model.persisted = self.now();
                return self.persistenceService.createObject(clone.persistenceSpace, clone.id, clone.model)
                    .then(function(){
                        return self.deferred.notify({phase: "copying", totalObjects: self.clones.length, processed: ++self.persisted});
                    });
            }));
        };

        /**
         * Will add a list of clones to the specified parent's composition
         * @private
         */
        CopyTask.prototype.addClonesToParent = function() {
            var parentClone = this.clones[this.clones.length-1],
                self = this;

            if (!this.parent.hasCapability('composition')){
                return this.$q.reject();
            }

            return this.persistenceService
                .updateObject(parentClone.persistenceSpace, parentClone.id, parentClone.model)
                .then(function(){return self.parent.getCapability("composition").add(parentClone.id);})
                .then(function(){return self.parent.getCapability("persistence").persist();})
                .then(function(){return parentClone;});
            // Ensure the clone of the original domainObject is returned
        };

        /**
         * Given an array of objects composed by a parent, clone them, then
         * add them to the parent.
         * @private
         * @returns {*}
         */
        CopyTask.prototype.copyComposees = function(composees, clonedParent, originalParent){
            var self = this;

            return (composees || []).reduce(function(promise, composee){
                //If the composee is composed of other
                // objects, chain a promise..
                return promise.then(function(){
                    // ...to recursively copy it (and its children)
                    return self.copy(composee, originalParent).then(function(composee){
                        composeChild(composee, clonedParent);
                    });
                });}, self.$q.when(undefined)
            );
        };

        /**
         * A recursive function that will perform a bottom-up copy of
         * the object tree with originalObject at the root. Recurses to
         * the farthest leaf, then works its way back up again,
         * cloning objects, and composing them with their child clones
         * as it goes
         * @private
         * @param originalObject
         * @param originalParent
         * @returns {*}
         */
        CopyTask.prototype.copy = function(originalObject, originalParent) {
            var self = this,
                modelClone = {
                id: uuid(),
                model: cloneObjectModel(originalObject.getModel()),
                persistenceSpace: originalParent.hasCapability('persistence') && originalParent.getCapability('persistence').getSpace()
            };

            return this.$q.when(originalObject.useCapability('composition')).then(function(composees){
                self.deferred.notify({phase: "preparing"});
                //Duplicate the object's children, and their children, and
                // so on down to the leaf nodes of the tree.
                return self.copyComposees(composees, modelClone, originalObject).then(function (){
                    //Add the clone to the list of clones that will
                    //be returned by this function
                    self.clones.push(modelClone);
                    return modelClone;
                });
            });
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
            var self = this;

            return this.copy(self.domainObject, self.parent).then(function(domainObjectClone){
                domainObjectClone.model.location = self.parent.getId();
            });
        };

        /**
         * Execute the copy task with the objects provided in the constructor.
         * @returns {promise} Which will resolve with a clone of the object
         * once complete.
         */
        CopyTask.prototype.perform = function(){
            var persistObjects = this.persistObjects.bind(this),
                addClonesToParent = this.addClonesToParent.bind(this);

            this.deferred = this.$q.defer();

            this.buildCopyPlan()
                .then(persistObjects)
                .then(addClonesToParent)
                .then(this.deferred.resolve, this.deferred.reject);

            return this.deferred.promise;
        };

        return CopyTask;
    }
);