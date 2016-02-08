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


/**
 * This bundle contains services for managing the flow of execution,
 * such as support for running web workers on background threads.
 * @namespace platform/execution
 */
define(
    [],
    function () {
        "use strict";

        /**
         * Runs long-running tasks with progress reporting.
         * @memberof platform/execution
         * @constructor
         */
        function TaskService(dialogService, notificationService) {
            this.dialogService = dialogService;
            this.notificationService = notificationService;
        }

        /**
         * Invoked to update progress associated with a running task.
         * @callback TaskService~progressCallback
         * @param {NotificationModel} model current progress to show
         */

        /**
         * Initiate a new task.
         *
         * @param {function(progress : TaskService~progressCallback} : Task)}
         *        taskFactory a function which, when provided a
         *        progress-reporting callback, will return the task to run.
         * @returns {Promise} a promise for the result of the task
         */
        TaskService.prototype.run = function (task) {
            var model = {},
                dialogService = this.dialogService,
                notificationService = this.notificationService;

            function reportProgress(progressModel) {

            }

            return task.run(reportProgress);
        };

        return TaskService;
    }
);

