/*****************************************************************************
 * Open MCT, Copyright (c) 2009-2016, United States Government
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

define(["./ExportTimelineAsCSVTask"], function (ExportTimelineAsCSVTask) {

    /**
     * Implements the "Export Timeline as CSV" action.
     *
     * @param exportService the service used to perform the CSV export
     * @param notificationService the service used to show notifications
     * @param {Array} resources an array of `resources` extensions
     * @param context the Action's context
     * @implements {Action}
     * @constructor
     * @memberof {platform/features/timeline}
     */
    function ExportTimelineAsCSVAction(
        $log,
        exportService,
        notificationService,
        resources,
        context
    ) {
        this.$log = $log;
        this.task = new ExportTimelineAsCSVTask(
            exportService,
            resources,
            context.domainObject
        );
        this.notificationService = notificationService;
    }

    ExportTimelineAsCSVAction.prototype.perform = function () {
        var notificationService = this.notificationService,
            notification = notificationService.notify({
                title: "Exporting CSV",
                unknownProgress: true
            }),
            $log = this.$log;

        return this.task.run()
            .then(function () {
                notification.dismiss();
            })
            .catch(function (err) {
                $log.warn(err);
                notification.dismiss();
                notificationService.error("Error exporting CSV");
            });
    };

    ExportTimelineAsCSVAction.appliesTo = function (context) {
        return context.domainObject &&
            context.domainObject.hasCapability('type') &&
                context.domainObject.getCapability('type')
                    .instanceOf('timeline');
    };

    return ExportTimelineAsCSVAction;
});
