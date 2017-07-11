/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2017, United States Government
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

define([], function () {

    /**
     * The ExportAsJSONAction is available from context menus and allows a user
     * to export any creatable domain object as a JSON file.
     *
     * @implements {Action}
     * @constructor
     * @memberof platform/import-export
     */
    function ExportAsJSONAction(
        exportService,
        policyService,
        identifierService,
        context
    ) {

        this.root = {};
        this.tree = {};
        this.calls = 0;
        this.context = context;
        this.externalIdentifiers = [];
        this.exportService = exportService;
        this.policyService = policyService;
        this.identifierService = identifierService;
    }

    ExportAsJSONAction.prototype.perform = function () {
        this.root = this.context.domainObject;
        this.tree[this.root.getId()] = this.root.getModel();
        this.saveAs = function (completedTree) {
            this.exportService.exportJSON(
                completedTree,
                {filename: this.root.getModel().name + '.json'}
            );
        };

        this.write(this.root);
    };

    /**
     * Traverses object hierarchy and populates tree object with models and
     * identifiers.
     *
     * @private
     * @param {Object} parent
     */
    ExportAsJSONAction.prototype.write = function (parent) {

        this.calls++;
        if (parent.hasCapability('composition')) {
            parent.useCapability('composition')
                .then(function (children) {
                    children.forEach(function (child, index) {
                        // Only export if object is creatable
                        if (this.isCreatable(child)) {
                            // Prevents infinite export of self-contained objs
                            if (!this.tree.hasOwnProperty(child.getId())) {
                                // If object is a link to something absent from
                                // tree, generate new id and treat as new object
                                if (this.isExternal(child, parent)) {
                                    this.rewriteLink(child, parent);
                                } else {
                                    this.tree[child.getId()] = child.getModel();
                                }
                                this.write(child);
                            }
                        }
                    }.bind(this));
                    this.calls--;
                    if (this.calls === 0) {
                        this.saveAs(this.wrapTree());
                    }
                }.bind(this));
        } else {
            this.calls--;
            if (this.calls === 0) {
                this.saveAs(this.wrapTree());
            }
        }
    };

    /**
     * Exports an externally linked object as an entirely new object in the
     * case where the original is not present in the exported tree.
     *
     * @private
     */
    ExportAsJSONAction.prototype.rewriteLink = function (child, parent) {
        this.externalIdentifiers.push(child.getId());
        var parentModel = parent.getModel();
        var childModel = child.getModel();
        var index = parentModel.composition.indexOf(child.getId());
        var newModel = this.copyModel(childModel);
        var newId = this.identifierService.generate();

        newModel.location = parent.getId();
        this.tree[newId] = newModel;
        this.tree[parent.getId()] = this.copyModel(parentModel);
        this.tree[parent.getId()].composition[index] = newId;
    };

    ExportAsJSONAction.prototype.copyModel = function (model) {
        var jsonString = JSON.stringify(model);
        return JSON.parse(jsonString);
    };

    ExportAsJSONAction.prototype.isExternal = function (child, parent) {
        if (child.getModel().location !== parent.getId() &&
            !Object.keys(this.tree).includes(child.getModel().location) &&
            child.getId() !== this.root.getId() ||
            this.externalIdentifiers.includes(child.getId())) {

            return true;
        }
        return false;
    };

    /**
     * Wraps root object for identification on reimport and wraps entire
     * exported JSON construct for validation.
     *
     * @private
     */
    ExportAsJSONAction.prototype.wrapTree = function () {
        return {
            "openmct": this.tree,
            "rootId": this.root.getId()
        };
    };

    ExportAsJSONAction.prototype.isCreatable = function (domainObject) {
        return this.policyService.allow(
            "creation",
            domainObject.getCapability("type")
        );
    };

    return ExportAsJSONAction;
});
