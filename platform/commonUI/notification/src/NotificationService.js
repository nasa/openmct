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
    ["./MessageSeverity"],
    function (MessageSeverity) {
        "use strict";
        /**
         * The notification service is responsible for informing the user of
         * events via the use of banner notifications.
         * @memberof platform/commonUI/notification
         * @constructor
         */
        function NotificationService($timeout, DEFAULT_AUTO_DISMISS) {
            this.notifications = [];
            this.$timeout = $timeout;
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

        Notification.prototype.minimize = function (setValue) {
            if (typeof setValue !== undefined){
                this.model.minimized = setValue;
            } else {
                return this.model.minimized;
            }
        };

        NotificationService.prototype.getActiveNotification = function (){
            return this.active.notification;
        }

        /**
         * model = {
         *
         * }
         * @param model
         */
        NotificationService.prototype.notify = function (model) {
            var notification = new Notification(model),
                that=this;
            this.notifications.push(notification);
            /*
            Check if there is already an active (ie. visible) notification
             */
            if (!this.active.notification){
                setActiveNotification.call(this, notification);

            } else if (!this.active.timeout){
                /*
                 If there is already an active notification, time it out. If it's
                 already got a timeout in progress (either because it has had
                 timeout forced because of a queue of messages, or it had an
                 autodismiss specified), leave it to run.

                 This notifcation has been added to queue and will be
                  serviced as soon as possible.
                 */
                this.active.timeout = this.$timeout(function () {
                    that.dismissOrMinimize(that.active.notification);
                });
            }

        };

        function setActiveNotification (notification) {
            var that = this;
            this.active.notification = notification;
            /*
            If autoDismiss has been specified, setup a timeout to
            dismiss the dialog.

            If there are other notifications pending in the queue, set this
            one to auto-dismiss
             */
            if (notification.model.autoDismiss
                || selectNextNotification.call(this)) {
                var timeout = isNaN(notification.model.autoDismiss) ?
                    this.DEFAULT_AUTO_DISMISS : notification.model.autoDismiss;

                this.active.timeout = this.$timeout(function () {
                    that.dismissOrMinimize(notification);
                }, timeout);
            }
        }

        function selectNextNotification () {
            /*
            Loop through the notifications queue and find the first one that
            has not already been minimized (manually or otherwise).
             */
            for (var i=0; i< this.notifications.length; i++) {
                var notification = this.notifications[i];

                if (!notification.model.minimized
                    && notification!= this.activeNotification) {

                    return notification;
                }
            }
        };

        /**
         * Minimize a notification. The notification will still be available
         * from the notification list. Typically notifications with a
         * severity of SUCCESS should not be minimized, but rather
         * dismissed.
         * @see dismiss
         * @see dismissOrMinimize
         * @param notification
         */
        NotificationService.prototype.minimize = function (notification) {
            //Check this is a known notification
            var index = this.notifications.indexOf(notification);
            if (index >= 0) {
                notification.minimize(true);
                delete this.active.notification;
                delete this.active.timeout;
                setActiveNotification.call(this, selectNextNotification.call(this));
            }
        }

        /**
         * Completely remove a notification. This will dismiss it from the
         * message banner and remove it from the list of notifications.
         * Typically only notifications with a severity of SUCCESS should be
         * dismissed. If you're not sure whether to dismiss or minimize a
         * notification, use the dismissOrMinimize method.
         * dismiss
         * @see dismissOrMinimize
         * @param notification The notification to dismiss
         */
        NotificationService.prototype.dismiss = function (notification) {
            //Check this is a known notification
            var index = this.notifications.indexOf(notification);
            if (index >= 0) {
                this.notifications.splice(index, 1);

                delete this.active.notification;
                delete this.active.timeout;

                setActiveNotification.call(this, selectNextNotification.call(this));
            }
        }

        /**
         * Depending on the severity of the notification will selectively
         * dismiss or minimize where appropriate.
         * @see dismiss
         * @see minimize
         * @param notification
         */
        NotificationService.prototype.dismissOrMinimize = function (notification){
            if (notification.model.severity > MessageSeverity.SUCCESS){
                this.minimize(notification);
            } else {
                this.dismiss(notification);
            }
        };
        return NotificationService;
    });