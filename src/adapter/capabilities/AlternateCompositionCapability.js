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

/**
 * Module defining AlternateCompositionCapability. Created by vwoeltje on 11/7/14.
 */
define([
    '../../api/objects/object-utils',
    '../../api/composition/CompositionAPI'
], function (objectUtils, CompositionAPI) {

        function AlternateCompositionCapability($injector, domainObject) {
            this.domainObject = domainObject;

            this.getDependencies = function () {
                this.instantiate = $injector.get("instantiate");
                this.contextualize = $injector.get("contextualize");
                this.getDependencies = undefined;
            }.bind(this);
        }

        AlternateCompositionCapability.prototype.add = function (child, index) {
            if (typeof index !== 'undefined') {
                // At first glance I don't see a location in the existing
                // codebase where add is called with an index.  Won't support.
                throw new Error(
                    'Composition Capability does not support adding at index'
                );
            }

            function addChildToComposition(model) {
                var existingIndex = model.composition.indexOf(child.getId());
                if (existingIndex === -1) {
                    model.composition.push(child.getId())
                }
            }

            return this.domainObject.useCapability(
                    'mutation',
                    addChildToComposition
                )
                .then(this.invoke.bind(this))
                .then(function (children) {
                    return children.filter(function (c) {
                        return c.getId() === child.getId();
                    })[0];
                });
        };

        AlternateCompositionCapability.prototype.contextualizeChild = function (
            child
        ) {
            if (this.getDependencies) {
                this.getDependencies();
            }

            var keyString = objectUtils.makeKeyString(child.key);
            var oldModel = objectUtils.toOldFormat(child);
            var newDO = this.instantiate(oldModel, keyString);
            return this.contextualize(newDO, this.domainObject);

        };

        AlternateCompositionCapability.prototype.invoke = function () {
            var newFormatDO = objectUtils.toNewFormat(
                this.domainObject.getModel(),
                this.domainObject.getId()
            );
            var collection = CompositionAPI(newFormatDO);
            return collection.load()
                .then(function (children) {
                    collection.destroy();
                    return children.map(this.contextualizeChild, this);
                }.bind(this));
        };

        AlternateCompositionCapability.appliesTo = function (model) {
            return !!CompositionAPI(objectUtils.toNewFormat(model, model.id));
        };

        return AlternateCompositionCapability;
    }
);
