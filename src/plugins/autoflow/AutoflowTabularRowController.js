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
    function AutoflowTabularRowController(domainObject, data, openmct, callback) {
        this.domainObject = domainObject;
        this.data = data;
        this.openmct = openmct;

        this.metadata = this.openmct.telemetry.getMetadata(childObject);
        this.ranges = metadata.valuesForHints(['range']);
        this.domains = metadata.valuesForHints(['domain']);
        this.rangeFormatter =
            this.openmct.telemetry.getValueFormatter(this.ranges[0]);
        this.domainFormatter =
            this.openmct.telemetry.getValueFormatter(this.domains[0]);
        this.evaluator =
            this.openmct.telemetry.limitEvaluator(this.domainObject);
    }

    AutoflowTabularRowController.prototype.updateRowData = function (datum) {
        var violations = evaluator.evaluate(datum, ranges[0]);

        this.data.classes = violations ? violations.cssClass : "";
        this.data.value = this.rangeFormatter.format(datum);
        this.callback(this.domainFormatter.format(datum));
    };

    AutoflowTabularRowController.prototype.activate = function () {
        this.destroy = this.openmct.telemetry.subscribe(
            this.domainObject,
            this.updateRowData.bind(this)
        );
    };

    AutoflowTabularRowController.prototype.destroy = function () {
        throw new Error("Not activated");
    };

    return AutoflowTabularRowController;
});
