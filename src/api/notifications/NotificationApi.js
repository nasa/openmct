/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2018, United States Government
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

/**
 * This bundle implements the notification service, which can be used to
 * show banner notifications to the user. Banner notifications
 * are used to inform users of events in a non-intrusive way. As
 * much as possible, notifications share a model with blocking
 * dialogs so that the same information can be provided in a dialog
 * and then minimized to a banner notification if needed.
 *
 * @namespace platform/api/notifications
 */
import moment from 'moment';
import EventEmitter from 'EventEmitter';
import MCTNotification from './MCTNotification.js';

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
 * @property {boolean} [autoDismiss] If truthy, dialog will
 * be automatically minimized or dismissed (depending on severity).
 * Additionally, if the provided value is a number, it will be used
 * as the delay period before being dismissed.
 * @property {boolean} [dismissable=true] If true, notification will
 * include an option to dismiss it completely.
 * @see DialogModel
 */

const DEFAULT_AUTO_DISMISS_TIMEOUT = 3000;
const MINIMIZE_ANIMATION_TIMEOUT = 300;

/**
 * The notification service is responsible for informing the user of
 * events via the use of banner notifications.
 * @memberof platform/commonUI/notification
 * @constructor
 * @param defaultAutoDismissTimeout The period of time that an
 * auto-dismissed message will be displayed for.
 * @param minimizeAnimationTimeout When notifications are minimized, a brief
 * animation is shown. This animation requires some time to execute,
 * so a timeout is required before the notification is hidden
 */
export default class NotificationAPI extends EventEmitter {
    constructor() {
        super();
        this.notifications = [];
        this.highest = { severity: "info" };

        /*
        * A context in which to hold the active notification and a
        * handle to its timeout.
        */
        this.activeNotification = undefined;
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
    minimize(notification) {
        //Check this is a known notification
        let index = this.notifications.indexOf(notification);

        if (this.activeTimeout) {
            /*
                Method can be called manually (clicking dismiss) or
                automatically from an auto-timeout. this.activeTimeout
                acts as a semaphore to prevent race conditions. Cancel any
                timeout in progress (for the case where a manual dismiss
                has shortcut an active auto-dismiss), and clear the
                semaphore.
                */
            clearTimeout(this.activeTimeout);
            delete this.activeTimeout;
        }

        if (index >= 0) {
            notification.model.minimized = true;
            //Add a brief timeout before showing the next notification
            // in order to allow the minimize animation to run through.
            setTimeout(() => {
                notification.emit('destroy');
                this.setActiveNotification(this.selectNextNotification());
            }, MINIMIZE_ANIMATION_TIMEOUT);
        }
    }

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
    dismiss(notification) {
        //Check this is a known notification
        let index = this.notifications.indexOf(notification);

        if (this.activeTimeout) {
            /* Method can be called manually (clicking dismiss) or
                * automatically from an auto-timeout. this.activeTimeout
                * acts as a semaphore to prevent race conditions. Cancel any
                * timeout in progress (for the case where a manual dismiss
                * has shortcut an active auto-dismiss), and clear the
                * semaphore.
                */

            clearTimeout(this.activeTimeout);
            delete this.activeTimeout;
        }

        if (index >= 0) {
            this.notifications.splice(index, 1);
        }
        this.setActiveNotification(this.selectNextNotification());
        this.setHighestSeverity();
        notification.emit('destroy');
    }

    /**
     * Depending on the severity of the notification will selectively
     * dismiss or minimize where appropriate.
     *
     * @private
     */
    dismissOrMinimize(notification) {
        let model = notification.model;
        if (model.severity === "info") {
            if (model.autoDismiss === false) {
                this.minimize(notification);
            } else {
                this.dismiss(notification);
            }
        } else {
            this.minimize(notification);
        }
    }

    /**
     * Returns the notification that is currently visible in the banner area
     * @returns {Notification}
     */
    getActiveNotification() {
        return this.activeNotification;
    }

    /**
     * A convenience method for info notifications. Notifications
     * created via this method will be auto-destroy after a default
     * wait period unless explicitly forbidden by the caller through
     * the {autoDismiss} property on the {NotificationModel}, in which
     * case the notification will be minimized after the wait.
     * @param {NotificationModel | string} message either a string for
     * the title of the notification message, or a {@link NotificationModel}
     * defining the options notification to display
     * @returns {Notification} the provided notification decorated with
     * functions to dismiss or minimize
     */
    info(message) {
        let notificationModel = typeof message === "string" ? {title: message} : message;
        notificationModel.severity = "info";
        return this.notify(notificationModel);
    }

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
    alert(message) {
        let notificationModel = typeof message === "string" ? {title: message} : message;
        notificationModel.severity = "alert";
        return this.notify(notificationModel);
    }

    /**
     * A convenience method for error notifications. Notifications
     * created via this method will will have severity of "error" enforced
     * @param {NotificationModel | string} message either a string for
     * the title of the error message with default options, or a
     * {@link NotificationModel} defining the options of the notification to
     * display
     * @returns {Notification} the provided notification decorated with
     * functions to dismiss or minimize
     */
    error(message) {
        let notificationModel = typeof message === "string" ? {title: message} : message;
        notificationModel.severity = "error";
        return this.notify(notificationModel);
    }

    /**
     * @private
     */
    setHighestSeverity() {
        let severity = {
            "info": 1,
            "alert": 2,
            "error": 3
        };
        this.highest.severity = this.notifications.reduce((previous, notification) => {
            if (severity[notification.model.severity] > severity[previous]) {
                return notification.model.severity;
            } else {
                return previous;
            }
        }, "info");
    }

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
    notify(notificationModel) {
        let notification;
        let activeNotification = this.activeNotification;

        notificationModel.severity = notificationModel.severity || "info";
        notificationModel.timestamp = moment.utc().format('YYYY-MM-DD hh:mm:ss.ms');

        notification = new MCTNotification(notificationModel, this);

        this.notifications.push(notification);
        this.setHighestSeverity();

        /*
        Check if there is already an active (ie. visible) notification
            */
        if (!this.activeNotification) {
            this.setActiveNotification(notification);
        } else if (!this.activeTimeout) {
            /*
                If there is already an active notification, time it out. If it's
                already got a timeout in progress (either because it has had
                timeout forced because of a queue of messages, or it had an
                autodismiss specified), leave it to run. Otherwise force a
                timeout.

                This notification has been added to queue and will be
                serviced as soon as possible.
                */
            this.activeTimeout = setTimeout(() => {
                this.dismissOrMinimize(activeNotification);
            }, DEFAULT_AUTO_DISMISS_TIMEOUT);
        }
        
        return notification;
    }

    /**
     * Used internally by the NotificationService
     * @private
     */
    setActiveNotification(notification) {
        let shouldAutoDismiss;
        this.activeNotification = notification;

        if (!notification) {
            delete this.activeTimeout;
            return;
        }
        this.emit('notification', notification);

        if (notification.model.severity === "info") {
            shouldAutoDismiss = true;
        } else {
            shouldAutoDismiss = notification.model.autoDismiss;
        }

        if (shouldAutoDismiss || this.selectNextNotification()) {
            this.activeTimeout = setTimeout(() => {
                this.dismissOrMinimize(notification);
            }, DEFAULT_AUTO_DISMISS_TIMEOUT);
        } else {
            delete this.activeTimeout;
        }
    }

    /**
     * Used internally by the NotificationService
     *
     * @private
     */
    selectNextNotification() {
        let notification;
        let i = 0;

        /*
        Loop through the notifications queue and find the first one that
        has not already been minimized (manually or otherwise).
            */
        for (; i < this.notifications.length; i++) {
            notification = this.notifications[i];

            if (!notification.model.minimized &&
                notification !== this.activeNotification) {
                return notification;
            }
        }
    }
}
