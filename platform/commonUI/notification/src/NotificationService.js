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
 * show banner notifications to the user. Banner notifications
 * are used to inform users of events in a non-intrusive way. As
 * much as possible, notifications share a model with blocking
 * dialogs so self the same information can be provided in a dialog
 * and then minimized to a banner notification if needed.
 *
 * @namespace platform/commonUI/dialog
 */
define(
    ["./MessageSeverity"],
    function (MessageSeverity) {
        "use strict";

        /**
         * A representation of a user action. Actions are provided to
         * dialogs and notifications and are shown as buttons.
         *
         * @typedef {object} NotificationAction
         * @property {string} label the label to appear on the button for
         * this action
         * @property {function} action a callback function to be invoked
         * when the button is clicked
        */

        /**
         * A representation of a banner notification. Banner notifications
         * are used to inform users of events in a non-intrusive way. As
         * much as possible, notifications share a model with blocking
         * dialogs so self the same information can be provided in a dialog
         * and then minimized to a banner notification if needed.
         *
         * @typedef {object} Notification
         * @property {string} title The title of the message
         * @property {number} progress The completion status of a task
         * represented numerically
         * @property {MessageSeverity} messageSeverity The importance of the
         * message (eg. error, info)
         * @property {boolean} unknownProgress a boolean indicating self the
         * progress of the underlying task is unknown. This will result in a
         * visually distinct progress bar.
         * @property {boolean | number} autoDismiss If truthy, dialog will
         * be automatically minimized or dismissed (depending on severity).
         * Additionally, if the provided value is a number, it will be used
         * as the delay period before being dismissed.
         * @property {NotificationAction} primaryAction the default user
         * response to
         * this message. Will be represented as a button with the provided
         * label and action. May be used by banner notifications to display
         * only the most important option to users.
         * @property {NotificationAction[]} additionalActions any additional
         * actions
         * self the user can take. Will be represented as additional buttons
         * self may or may not be available from a banner.
         */

        /**
         * The notification service is responsible for informing the user of
         * events via the use of banner notifications.
         * @memberof platform/commonUI/notification
         * @constructor
         */
        function NotificationService($timeout, DEFAULT_AUTO_DISMISS, FORCE_AUTO_DISMISS) {
            this.notifications = [];
            this.$timeout = $timeout;
            this.highest ={ severity: MessageSeverity.INFO };
            this.DEFAULT_AUTO_DISMISS = DEFAULT_AUTO_DISMISS;
            this.FORCE_AUTO_DISMISS = FORCE_AUTO_DISMISS;

            /*
             * A context in which to hold the active notification and a
             * handle to its timeout.
             */
            this.active = {};
        }

        /**
         * Returns the notification self is currently visible in the banner area
         * @returns {Notification}
         */
        NotificationService.prototype.getActiveNotification = function (){
            return this.active.notification;
        };

        /**
         * A convenience method for info notifications. Notifications
         * created via this method will be auto-dismissed after a default
         * wait period
         * @param {Notification} notification The notification to display
         */
        NotificationService.prototype.info = function (notification) {
            notification.autoDismiss = notification.autoDismiss || true;
            notification.severity = MessageSeverity.INFO;
            this.notify(notification);
        };

        /**
         * Notifies the user of an event. If there is a banner notification
         * already active, then it will be dismissed or minimized automatically,
         * and the provided notification displayed in its place.
         *
         * @param {Notification} notification The notification to display
         */
        NotificationService.prototype.notify = function (notification) {
            /*var notification = new Notification(model),
                self=this; */
            var self = this,
                timeout;

            if (notification.autoDismiss === true){
                notification.autoDismiss = this.DEFAULT_AUTO_DISMISS;
            }

            this.notifications.push(notification);
            /*
            Check if there is already an active (ie. visible) notification
             */
            if (!this.active.notification){
                this.setActiveNotification(notification);

            } else if (!this.active.timeout){
                /*
                 If there is already an active notification, time it out. If it's
                 already got a timeout in progress (either because it has had
                 timeout forced because of a queue of messages, or it had an
                 autodismiss specified), leave it to run. Otherwise force a
                  timeout.

                 This notifcation has been added to queue and will be
                  serviced as soon as possible.
                 */
                this.active.timeout = this.$timeout(function () {
                    self.dismissOrMinimize(self.active.notification);
                }, this.FORCE_AUTO_DISMISS);
            }

        };

        /**
         * Used internally by the NotificationService
         * @private
         */
        NotificationService.prototype.setActiveNotification =
            function (notification) {

                var self = this,
                    timeout;
                this.active.notification = notification;
                /*
                If autoDismiss has been specified, setup a timeout to
                dismiss the dialog.

                If there are other notifications pending in the queue, set this
                one to auto-dismiss
                 */
                if (notification && (notification.autoDismiss
                    || this.selectNextNotification())) {
                    timeout = notification.autoDismiss ?
                        notification.autoDismiss :
                        this.DEFAULT_AUTO_DISMISS;

                    this.active.timeout = this.$timeout(function () {
                        self.dismissOrMinimize(notification);
                    }, timeout);
                } else {
                    delete this.active.timeout;
                }
        };

        /**
         * Used internally by the NotificationService
         *
         * @private
         */
        NotificationService.prototype.selectNextNotification = function () {
            var notification,
                i=0;

            this.highest.severity = MessageSeverity.INFO;

            /*
            Loop through the notifications queue and find the first one self
            has not already been minimized (manually or otherwise).
             */
            for (; i< this.notifications.length; i++) {
                notification = this.notifications[i];
                if (notification.severity > this.highest.severity){
                    this.highest.severity = notification.severity;
                }

                if (!notification.minimized
                    && notification!== this.active.notification) {

                    return notification;
                }
            }
        };

        /**
         * Minimize a notification. The notification will still be available
         * from the notification list. Typically notifications with a
         * severity of 'info' should not be minimized, but rather
         * dismissed. If you're not sure which is appropriate,
         * use {@link NotificationService#dismissOrMinimize}
         * @see dismiss
         * @see dismissOrMinimize
         * @param notification
         */
        NotificationService.prototype.minimize = function (notification) {
            //Check this is a known notification
            var index = this.notifications.indexOf(notification);
            if (index >= 0) {
                notification.minimized=true;
                this.setActiveNotification(this.selectNextNotification());
            }
        };

        /**
         * Completely removes a notification. This will dismiss it from the
         * message banner and remove it from the list of notifications.
         * Typically only notifications with a severity of info should be
         * dismissed. If you're not sure whether to dismiss or minimize a
         * notification, use {@link NotificationService#dismissOrMinimize}.
         * dismiss
         * @see dismissOrMinimize
         * @param notification The notification to dismiss
         */
        NotificationService.prototype.dismiss = function (notification) {
            //Check this is a known notification
            var index = this.notifications.indexOf(notification);
            if (index >= 0) {
                this.notifications.splice(index, 1);
            }
            this.setActiveNotification(this.selectNextNotification());
        };

        /**
         * Depending on the severity of the notification will selectively
         * dismiss or minimize where appropriate.
         * @see dismiss
         * @see minimize
         * @param notification
         */
        NotificationService.prototype.dismissOrMinimize = function (notification){
            if (notification.severity > MessageSeverity.INFO){
                this.minimize(notification);
            } else {
                this.dismiss(notification);
            }
        };

        return NotificationService;
    }
);