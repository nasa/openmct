/*****************************************************************************
 * Open MCT Web, Copyright (c) 2009-2015, United States Government
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
/*global define,Promise*/

/**
 * Module defining ExportTimelineAsCSVTask. Created by vwoeltje on 2/8/16.
 */
define([
    "./TimelineTraverser",
    "./TimelineColumnizer"
], function (TimelineTraverser, TimelineColumnizer) {
    "use strict";

    /**
     * Runs (and coordinates) the preparation and export of CSV data
     * for the "Export Timeline as CSV" action.
     *
     * @constructor
     * @memberof {platform/features/timeline}
     * @param exportService the service used to export as CSV
     * @param {DomainObject} domainObject the timeline being exported
     */
    function ExportTimelineAsCSVTask(exportService, domainObject) {
        this.domainObject = domainObject;
        this.exportService = exportService;
    }

    /**
     * Run this CSV export task.
     *
     * @returns {Promise} a promise that will be resolved when the
     *          export has finished (or rejected if there are problems.)
     */
    ExportTimelineAsCSVTask.prototype.run = function () {
        var exportService = this.exportService;

        function doExport(objects) {
            var exporter = new TimelineColumnizer(objects),
                options = { headers: exporter.headers() };
            return exporter.rows().then(function (rows) {
                return exportService.exportCSV(rows, options);
            });
        }

        return new TimelineTraverser(this.domainObject)
            .buildObjectList()
            .then(doExport);
    };

    return ExportTimelineAsCSVTask;
});
