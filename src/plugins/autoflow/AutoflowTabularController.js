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

        this.rowCount = 1;
        this.unlistens = [];
    }

    AutoflowTabularController.prototype.trackLastUpdated = function (value) {
        this.data.updated = value;
    };

    AutoflowTabularController.prototype.makeRow = function (childObject) {
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

        return row;
    };

    AutoflowTabularController.prototype.setObjects = function (domainObjects) {
        this.data.items = domainObjects.map(this.makeRow.bind(this));
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
