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
/*global define*/

define(["./ExportTimelineAsCSVTask"], function (ExportTimelineAsCSVTask) {
    'use strict';

    /**
     * Implements the "Export Timeline as CSV" action.
     *
     * @param exportService the service used to perform the CSV export
     * @param notificationService the service used to show notifications
     * @param context the Action's context
     * @implements {Action}
     * @constructor
     * @memberof {platform/features/timeline}
     */
    function ExportTimelineAsCSVAction(exportService, notificationService, context) {
        this.task = new ExportTimelineAsCSVTask(
            exportService,
            context.domainObject
        );
        this.notificationService = notificationService;
    }

    ExportTimelineAsCSVAction.prototype.perform = function () {
        var notificationService = this.notificationService,
            notification = notificationService.notify({
                title: "Exporting CSV",
                unknownProgress: true
            });

        return this.task.run()
            .then(function () {
                notification.dismiss();
            })
            .catch(function () {
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