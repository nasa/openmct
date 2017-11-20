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
    function AutoflowTabularController(domainObject, data, openmct) {
        this.domainObject = domainObject;
        this.data = data;
        this.openmct = openmct;

        this.rows = {};
        this.rowCount = 1;
        this.unlistens = [];
        this.active = false;
    }

    AutoflowTabularController.prototype.matchesFilter = function (domainObject) {
        var filter = this.data.filter;
        var name = domainObject.name;
        return name.toLowerCase().indexOf(filter.toLowerCase()) !== -1;
    };

    AutoflowTabularController.prototype.updateRow = function (row, format, evaluate, datum) {
        row.value = format(datum);
        row.classes = evaluate(datum).map(function (violation) {
            return violation.cssClass;
        }).join(" ");
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
        var metadata = this.openmct.telemetry.getMetadata(childObject);
        var values = metadata.valuesForHints(['range']);
        var valueMetadata = values[0];
        var formatter =
            this.openmct.telemetry.getValueFormatter(valueMetadata);
        var evaluator =
            this.openmct.telemetry.limitEvaluator(childObject);

        this.unlistens.push(this.openmct.telemetry.subscribe(
            childObject,
            this.updateRow.bind(
                this,
                row,
                formatter.format.bind(formatter),
                function (datum) {
                    var violations = evaluator.evaluate(datum, valueMetadata);
                    if (!violations) {
                        return [];
                    }
                    return Array.isArray(violations) ? violations : [violations];
                }
            )
        ));

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
        this.releaseSubscriptions();
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
        if (this.active) {
            this.destroy();
        }
        this.active = true;

        this.openmct.composition.get(this.domainObject)
            .load()
            .then(this.setObjects.bind(this));
    };

    AutoflowTabularController.prototype.destroy = function () {
        this.releaseSubscriptions();
        this.active = false;
    };

    AutoflowTabularController.prototype.releaseSubscriptions = function () {
        this.unlistens.forEach(function (unlisten) {
            unlisten();
        });

        this.unlistens = [];
    };

    return AutoflowTabularController;
});
