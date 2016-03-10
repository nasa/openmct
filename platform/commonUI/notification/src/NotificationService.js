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
 * dialogs so that the same information can be provided in a dialog
 * and then minimized to a banner notification if needed.
 *
 * @namespace platform/commonUI/notification
 */
define(
    [],
    function () {
        "use strict";

        /**
         * A representation of a user action. Options are provided to
         * dialogs and notifications and are shown as buttons.
         *
         * @typedef {object} NotificationOption
         * @property {string} label the label to appear on the button for
         * this action
         * @property {function} callback a callback function to be invoked
         * when the button is clicked
        */

        /**
         * A representation of a banner notification. Banner notifications
         * are used to inform users of events in a non-intrusive way. As
         * much as possible, notifications share a model with blocking
         * dialogs so that the same information can be provided in a dialog
         * and then minimized to a banner notification if needed, or vice-versa.
         *
         * @typedef {object} NotificationModel
         * @property {string} title The title of the message
         * @property {string} severity The importance of the message (one of
         * 'info', 'alert', or 'error' where info < alert <error)
         * @property {number} [progress] The completion status of a task
         * represented numerically
         * @property {boolean} [unknownProgress] a boolean indicating that the
         * progress of the underlying task is unknown. This will result in a
         * visually distinct progress bar.
         * @property {boolean | number} [autoDismiss] If truthy, dialog will
         * be automatically minimized or dismissed (depending on severity).
         * Additionally, if the provided value is a number, it will be used
         * as the delay period before being dismissed.
         * @property {boolean} [dismissable=true] If true, notification will
         * include an option to dismiss it completely.
         * @property {NotificationOption} [primaryOption] the default user
         * response to
         * this message. Will be represented as a button with the provided
         * label and action. May be used by banner notifications to display
         * only the most important option to users.
         * @property {NotificationOption[]} [options] any additional
         * actions the user can take. Will be represented as additional buttons
         * that may or may not be available from a banner.
         * @see DialogModel
         */

        /**
         * A wrapper object that is returned as a handle to a newly created
         * notification. Wraps the notifications model and decorates with
         * functions to dismiss or minimize the notification.
         *
         * @typedef {object} Notification
         * @property {function} dismiss This method is added to the object
         * returned by {@link NotificationService#notify} and can be used to
         * dismiss this notification. Dismissing a notification will remove
         * it completely and it will not appear in the notification indicator
         * @property {function} minimize This method is added to the object
         * returned by {@link NotificationService#notify} and can be used to
         * minimize this notification. Minimizing a notification will send
         * it to the notification indicator
         * @property {function} dismissOrMinimize This method is added to the
         * object returned by {@link NotificationService#notify}. It will
         * hide the notification by either dismissing or minimizing it,
         * depending on severity. Typically this is the method that should
         * be used for dismissing a notification. If more control is
         * required, then the minimize or dismiss functions can be called
         * individually.
         * @property {function} onDismiss Allows listening for on dismiss
         * events. This allows cleanup etc. when the notification is dismissed.
         */

        /**
         * The notification service is responsible for informing the user of
         * events via the use of banner notifications.
         * @memberof platform/commonUI/notification
         * @constructor
         * @param $timeout the Angular $timeout service
         * @param DEFAULT_AUTO_DISMISS The period of time that an
         * auto-dismissed message will be displayed for.
         * @param MINIMIZE_TIMEOUT When notifications are minimized, a brief
         * animation is shown. This animation requires some time to execute,
         * so a timeout is required before the notification is hidden
         */
        function NotificationService($timeout, topic, DEFAULT_AUTO_DISMISS, MINIMIZE_TIMEOUT) {
            this.notifications = [];
            this.$timeout = $timeout;
            this.highest ={ severity: "info" };
            this.DEFAULT_AUTO_DISMISS = DEFAULT_AUTO_DISMISS;
            this.MINIMIZE_TIMEOUT = MINIMIZE_TIMEOUT;
            this.topic = topic;

            /*
             * A context in which to hold the active notification and a
             * handle to its timeout.
             */
            this.active = {};
        }

        /**
         * Minimize a notification. The notification will still be available
         * from the notification list. Typically notifications with a
         * severity of 'info' should not be minimized, but rather
         * dismissed. If you're not sure which is appropriate,
         * use {@link Notification#dismissOrMinimize}
         *
         * @private
         */
        NotificationService.prototype.minimize = function (service, notification) {
            //Check this is a known notification
            var index = service.notifications.indexOf(notification);

            if (service.active.timeout){
                /*
                 Method can be called manually (clicking dismiss) or
                 automatically from an auto-timeout. this.active.timeout
                 acts as a semaphore to prevent race conditions. Cancel any
                 timeout in progress (for the case where a manual dismiss
                 has shortcut an active auto-dismiss), and clear the
                 semaphore.
                 */
                service.$timeout.cancel(service.active.timeout);
                delete service.active.timeout;
            }

            if (index >= 0) {
                notification.model.minimized=true;
                //Add a brief timeout before showing the next notification
                // in order to allow the minimize animation to run through.
                service.$timeout(function() {
                    service.setActiveNotification(service.selectNextNotification());
                }, service.MINIMIZE_TIMEOUT);
            }
        };

        /**
         * Completely removes a notification. This will dismiss it from the
         * message banner and remove it from the list of notifications.
         * Typically only notifications with a severity of info should be
         * dismissed. If you're not sure whether to dismiss or minimize a
         * notification, use {@link Notification#dismissOrMinimize}.
         * dismiss
         *
         * @private
         */
        NotificationService.prototype.dismiss = function (service, notification) {
            //Check this is a known notification
            var index = service.notifications.indexOf(notification);

            if (service.active.timeout){
                /* Method can be called manually (clicking dismiss) or
                 * automatically from an auto-timeout. this.active.timeout
                 * acts as a semaphore to prevent race conditions. Cancel any
                 * timeout in progress (for the case where a manual dismiss
                 * has shortcut an active auto-dismiss), and clear the
                 * semaphore.
                 */

                service.$timeout.cancel(service.active.timeout);
                delete service.active.timeout;
            }

            if (index >= 0) {
                service.notifications.splice(index, 1);
            }
            service.setActiveNotification(service.selectNextNotification());

            this.setHighestSeverity();
        };

        /**
         * Depending on the severity of the notification will selectively
         * dismiss or minimize where appropriate.
         *
         * @private
         */
        NotificationService.prototype.dismissOrMinimize = function (notification) {

            //For now minimize everything, and have discussion around which
            //kind of messages should or should not be in the minimized
            //notifications list
            notification.minimize();
        };

        /**
         * Returns the notification that is currently visible in the banner area
         * @returns {Notification}
         */
        NotificationService.prototype.getActiveNotification = function (){
            return this.active.notification;
        };

        /**
         * A convenience method for info notifications. Notifications
         * created via this method will be auto-dismissed after a default
         * wait period
         * @param {NotificationModel | string} message either a string for
         * the title of the notification message, or a {@link NotificationModel}
         * defining the options notification to display
         * @returns {Notification} the provided notification decorated with
         * functions to dismiss or minimize
         */
        NotificationService.prototype.info = function (message) {
            var notificationModel = typeof message === "string" ? {title: message} : message;
            notificationModel.autoDismiss = notificationModel.autoDismiss || true;
            notificationModel.severity = "info";
            return this.notify(notificationModel);
        };

        /**
         * A convenience method for alert notifications. Notifications
         * created via this method will will have severity of "alert" enforced
         * @param {NotificationModel | string} message either a string for
         * the title of the alert message with default options, or a
         * {@link NotificationModel} defining the options notification to
         * display
         * @returns {Notification} the provided notification decorated with
         * functions to dismiss or minimize
         */
        NotificationService.prototype.alert = function (message) {
            var notificationModel = typeof message === "string" ? {title: message} : message;
            notificationModel.severity = "alert";
            return this.notify(notificationModel);
        };

        /**
         * A convenience method for error notifications. Notifications
         * created via this method will will have severity of "error" enforced
         * @param {NotificationModel | string} message either a string for
         * the title of the error message with default options, or a
         * {@link NotificationModel} defining the options notification to
         * display
         * @returns {Notification} the provided notification decorated with
         * functions to dismiss or minimize
         */
        NotificationService.prototype.error = function (message) {
            var notificationModel = typeof message === "string" ? {title: message} : message;
            notificationModel.severity = "error";
            return this.notify(notificationModel);
        };

        /**
         * @private
         */
        NotificationService.prototype.setHighestSeverity = function () {
            var severity = {
                    "info": 1,
                    "alert": 2,
                    "error": 3
                };
            this.highest.severity = this.notifications.reduce(function(previous, notification){
                if (severity[notification.model.severity] > severity[previous]){
                    return notification.model.severity;
                } else {
                    return previous;
                }
            }, "info");
        };

        /**
         * Notifies the user of an event. If there is a banner notification
         * already active, then it will be dismissed or minimized automatically,
         * and the provided notification displayed in its place.
         *
         * @param {NotificationModel} notificationModel The notification to
         * display
         * @returns {Notification} the provided notification decorated with
         * functions to {@link Notification#dismiss} or {@link Notification#minimize}
         */
        NotificationService.prototype.notify = function (notificationModel) {
            var self = this,
                notification,
                activeNotification = self.active.notification,
                topic = this.topic();

            notification = {
                model: notificationModel,
                minimize: function() {
                    self.minimize(self, notification);
                },
                dismiss: function(){
                    self.dismiss(self, notification);
                    topic.notify();
                },
                dismissOrMinimize: function(){
                    self.dismissOrMinimize(notification);
                },
                onDismiss: function(callback) {
                    topic.listen(callback);
                }
            };

            notificationModel.severity = notificationModel.severity || "info";
            if (notificationModel.autoDismiss === true){
                notificationModel.autoDismiss = this.DEFAULT_AUTO_DISMISS;
            }

            //Notifications support a 'dismissable' attribute. This is a
            // convenience to support adding a 'dismiss' option to the
            // notification for the common case of dismissing a
            // notification. Could also be done manually by specifying an
            // option on the model
            if (notificationModel.dismissable !== false) {
                notificationModel.options = notificationModel.options || [];
                notificationModel.options.unshift({
                    label: "Dismiss",
                    callback: function() {
                        notification.dismiss();
                    }
                });
            }

            this.notifications.push(notification);

            this.setHighestSeverity();

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
                    activeNotification.dismissOrMinimize();
                }, this.DEFAULT_AUTO_DISMISS);
            }

            return notification;

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
                If autoDismiss has been specified, OR there are other
                 notifications queued for display, setup a timeout to
                  dismiss the dialog.
                 */
                if (notification && (notification.model.autoDismiss
                    || this.selectNextNotification())) {

                    timeout = notification.model.autoDismiss || this.DEFAULT_AUTO_DISMISS;
                    this.active.timeout = this.$timeout(function () {
                        notification.dismissOrMinimize();
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

            /*
            Loop through the notifications queue and find the first one that
            has not already been minimized (manually or otherwise).
             */
            for (; i< this.notifications.length; i++) {
                notification = this.notifications[i];

                if (!notification.model.minimized
                    && notification!== this.active.notification) {

                    return notification;
                }
            }
        };

        return NotificationService;
    }
);