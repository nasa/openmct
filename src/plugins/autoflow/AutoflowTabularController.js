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

define([
    './AutoflowTabularRowController'
], function (AutoflowTabularRowController) {
    function AutoflowTabularController(domainObject, data, openmct) {
        this.composition = openmct.composition.get(domainObject);
        this.data = data;
        this.openmct = openmct;

        this.rows = {};
        this.controllers = {};

        this.addRow = this.addRow.bind(this);
        this.removeRow = this.removeRow.bind(this);
    }

    AutoflowTabularController.prototype.trackLastUpdated = function (value) {
        this.data.updated = value;
    };

    AutoflowTabularController.prototype.addRow = function (childObject) {
        var identifier = childObject.identifier;
        var id = [identifier.namespace, identifier.key].join(":");

        if (!this.rows[id]) {
            this.rows[id] = {
                classes: "",
                name: childObject.name,
                value: undefined
            };
            this.controllers[id] = new AutoflowTabularRowController(
                childObject,
                this.rows[id],
                this.openmct,
                this.trackLastUpdated.bind(this)
            );
            this.controllers[id].activate();
            this.data.items.push(this.rows[id]);
        }
    };

    AutoflowTabularController.prototype.removeRow = function (identifier) {
        var id = [identifier.namespace, identifier.key].join(":");

        if (this.rows[id]) {
            this.data.items = this.data.items.filter(function (item) {
                return item !== this.rows[id];
            }.bind(this));
            this.controllers[id].destroy();
            delete this.controllers[id];
            delete this.rows[id];
        }
    };

    AutoflowTabularController.prototype.activate = function () {
        this.composition.on('add', this.addRow);
        this.composition.on('remove', this.removeRow);
        this.composition.load();
    };

    AutoflowTabularController.prototype.destroy = function () {
        Object.keys(this.controllers).forEach(function (id) {
            this.controllers[id].destroy();
        }.bind(this));
        this.controllers = {};
        this.composition.off('add', this.addRow);
        this.composition.off('remove', this.removeRow);
    };

    return AutoflowTabularController;
});
