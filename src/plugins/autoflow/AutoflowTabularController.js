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
        this.domainObject = domainObject;
        this.data = data;
        this.openmct = openmct;

        this.rows = {};
        this.rowCount = 1;
        this.unlistens = [];
        this.childObjects = [];
    }

    AutoflowTabularController.prototype.matchesFilter = function (domainObject) {
        var filter = this.data.filter;
        var name = domainObject.name;
        return name.toLowerCase().indexOf(filter.toLowerCase()) !== -1;
    };

    AutoflowTabularController.prototype.trackLastUpdated = function (value) {
        this.data.updated = value;
    };

    AutoflowTabularController.prototype.makeRow = function (childObject) {
        var id = [
            childObject.identifier.namespace,
            childObject.identifier.key
        ].join(":");

        if (this.rows[id]) {
            return this.rows[id];
        }

        var row = {
            classes: "",
            name: childObject.name,
            value: undefined
        };

        var controller = new AutoflowTabularRowController(
            childObject,
            row,
            this.openmct,
            this.trackLastUpdated.bind(this)
        );
        controller.activate();
        this.unlistens.push(controller.destroy.bind(controller));

        this.rows[id] = row;

        return row;
    };

    AutoflowTabularController.prototype.update = function () {
        var column = [];
        var index = 0;
        var filteredObjects =
            this.childObjects.filter(this.matchesFilter.bind(this));

        this.data.columns = [];

        while (index < filteredObjects.length) {
            if (column.length >= this.rowCount) {
                this.data.columns.push(column);
                column = [];
            }

            column.push(this.makeRow(filteredObjects[index]));
            index += 1;
        }

        if (column.length > 0) {
            this.data.columns.push(column);
        }
    };

    AutoflowTabularController.prototype.setObjects = function (domainObjects) {
        this.rows = {};
        this.childObjects = domainObjects;
        this.update();
    };

    AutoflowTabularController.prototype.setRows = function (rows) {
        var changed = this.rowCount !== rows;
        this.rowCount = rows;
        if (changed) {
            this.update();
        }
    };

    AutoflowTabularController.prototype.activate = function () {
        var composition = this.openmct.composition.get(this.domainObject);
        var reactivate = this.activate.bind(this);

        this.destroy();

        composition.on('remove', reactivate);
        composition.on('add', reactivate);
        this.unlistens.push(composition.off.bind(composition, 'remove', reactivate));
        this.unlistens.push(composition.off.bind(composition, 'add', reactivate));

        return composition.load().then(this.setObjects.bind(this));
    };

    AutoflowTabularController.prototype.destroy = function () {
        this.unlistens.forEach(function (unlisten) {
            unlisten();
        });

        this.unlistens = [];
    };

    return AutoflowTabularController;
});
