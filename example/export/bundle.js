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
/*global define*/

define(['legacyRegistry'], function (legacyRegistry) {
    "use strict";

    function ExportTelemetryAsCSVAction(exportService, context) {
        this.exportService = exportService;
        this.context = context;
    }

    ExportTelemetryAsCSVAction.prototype.perform = function () {
        var context = this.context,
            domainObject = context.domainObject,
            telemetry = domainObject.getCapability("telemetry"),
            metadata = telemetry.getMetadata(),
            domains = metadata.domains,
            ranges = metadata.ranges,
            exportService = this.exportService;

        function getName(domainOrRange) {
            return domainOrRange.name;
        }

        telemetry.requestData({}).then(function (series) {
            var headers = domains.map(getName).concat(ranges.map(getName)),
                rows = [],
                row,
                i;
            for (i = 0; i < series.getPointCount(); i += 1) {
                row = {};
                domains.forEach(function (domain) {
                    row[domain.name] = series.getDomainValue(i, domain.key);
                });
                ranges.forEach(function (range) {
                    row[range.name] = series.getRangeValue(i, range.key);
                });
                rows.push(row);
            }
            exportService.exportCSV(rows, { headers: headers });
        });
    };

    ExportTelemetryAsCSVAction.appliesTo = function (context) {
        return context.domainObject &&
                context.domainObject.hasCapability("telemetry");
    };

    legacyRegistry.register("example/export", {
        "name": "Example of using CSV Export",
        "extensions": {
            "actions": [
                {
                    "key": "example.export",
                    "name": "Export Telemetry as CSV",
                    "implementation": ExportTelemetryAsCSVAction,
                    "category": "contextual",
                    "glyph": "\u0033",
                    "depends": [ "exportService" ]
                }
            ]
        }
    });
});
