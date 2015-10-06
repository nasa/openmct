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
 * This bundle implements the notification service, which can be used to
 * show banner notifications to the user.
 * @namespace platform/commonUI/dialog
 */
define(
    [],
    function () {
        "use strict";
        /**
         * The notification service is responsible for informing the user of
         * events via the use of banner notifications.
         * @memberof platform/commonUI/notification
         * @constructor
         */
        function NotificationService($log, $timeout, messageSeverity, DEFAULT_AUTO_DISMISS) {
            //maintain an array of notifications.
            //expose a method for adding notifications.
            //expose a method for dismissing notifications.
            //expose a method for minimizing notifications.
            //expose a method for getting the 'current' notification. How
            //this is determined could be a little nuanced.
            //Allow for auto-dismissal of success messages
            //
            //
            //
            //     Questions:
            //     1) What happens when a newer, but lower priority
            //        message arrives (eg. success). Just show it? It will
            //        auto-dismissed, and the existing error message will be
            //        exposed.
            //

            this.notifications = [];
            this.$log = $log;
            this.$timeout = $timeout;
            this.messageSeverity = messageSeverity;
            this.DEFAULT_AUTO_DISMISS = DEFAULT_AUTO_DISMISS;

            /**
             * Exposes the current "active" notification. This is a
             * notification that is of current highest importance that has
             * not been dismissed. The deinition of what is of highest
             * importance might be a little nuanced and require tweaking.
             * For example, if an important error message is visible and a
             * success message is triggered, it may be desirable to
             * temporarily show the success message and then auto-dismiss it.
             * @type {{notification: undefined}}
             */
            this.active = {
                notification: undefined
            };
        }
        /**
        var model = {
            title: string,
            progress: number,
            severity: MessageSeverity,
            unknownProgress: boolean,
            minimized: boolean,
            autoDismiss: boolean | number,
            actions: {
                label: string,
                action: function
            }
        }
        */

        /**
         * Possibly refactor this out to a provider?
         * @constructor
         */
        function Notification (model) {
            this.model = model;
        }

        Notification.prototype.minimize = function () {
            if (typeof setValue !== undefined){
                model.minimized = setValue;
            } else {
                return model.minimized;
            }
        };

        /**
         * model = {
         *
         * }
         * @param model
         */
        NotificationService.prototype.notify = function (model) {
            var notification = new Notification(model);
            this.notifications.push(notification);
            this.setActiveNotification(notification);
        };



        NotificationService.prototype.setActiveNotification = function () {
            //If there is a message active, time it out, and then chain a
            // new message to appear.
            if (this.active.timeout){
                this.active.timeout = this.active.timeout.then(function (){
                    this.active.timeout = $timeout(function(){
                        this.dismiss(this.active.notification);
                    });
                });
            }
        };

        NotificationService.prototype.dismiss = function (notification) {
            var index = this.notifications.indexOf(notification);
            if (index >= 0) {
                this.notifications = this.notifications.splice(index, 1);
                delete this.active.notification;
            }
        }
        return NotificationService;
    });