/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2024, United States Government
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

import { EventEmitter } from 'eventemitter3';
import moment from 'moment';

import NotificationManager from './NotificationManager';

const DEFAULT_AUTO_DISMISS_TIMEOUT = 3000;
const MINIMIZE_ANIMATION_TIMEOUT = 300;

export default class NotificationAPI extends EventEmitter {
  constructor() {
    super();
    this.manager = new NotificationManager();
    this.notifications = [];
    this.highest = { severity: 'info' };
    this.activeNotification = undefined;
    this.activeTimeout = undefined;
  }

  info(message, options = {}) {
    const notificationModel = {
      message: message,
      severity: 'info',
      autoDismiss: true,
      options
    };

    return this._notify(notificationModel);
  }

  alert(message, options = {}) {
    const notificationModel = {
      message: message,
      severity: 'alert',
      options
    };

    return this._notify(notificationModel);
  }

  error(message, options = {}) {
    const notificationModel = {
      message: message,
      severity: 'error',
      options
    };

    return this._notify(notificationModel);
  }

  progress(message, progressPerc, progressText) {
    const notificationModel = {
      message: message,
      progressPerc: progressPerc,
      progressText: progressText,
      severity: 'info',
      options: {}
    };

    return this._notify(notificationModel);
  }

  /**
   * Dismiss all active notifications.
   */
  dismissAllNotifications() {
    this.notifications = [];
    this.emit('dismiss-all');
  }

  /**
   * Create a new notification group
   * @param {string} groupId unique identifier for the group
   * @param {Object} [options] group options
   */
  createGroup(groupId, options = {}) {
    return this.manager.createGroup(groupId, options);
  }

  /**
   * Add a notification to a specific group
   * @param {string} groupId the group identifier
   * @param {string} message the notification message
   * @param {Object} [options] notification options
   */
  groupedNotification(groupId, message, options = {}) {
    const notificationModel = {
      message,
      groupId,
      ...options
    };
    return this._notify(notificationModel);
  }

  /**
   * Register a new notification category
   * @param {string} category the category identifier
   * @param {Object} [options] category options
   */
  registerCategory(category, options = {}) {
    return this.manager.registerCategory(category, options);
  }

  /**
   * Get all currently active notifications
   * @returns {Array} array of active notifications
   */
  getActiveNotifications() {
    return this.manager.getActiveNotifications();
  }

  /**
   * Get all notifications for a specific group
   * @param {string} groupId the group identifier
   * @returns {Array} array of group notifications
   */
  getGroupNotifications(groupId) {
    return this.manager.getGroupNotifications(groupId);
  }

  /**
   * @private
   */
  _notify(notificationModel) {
    let notification;
    let activeNotification = this.activeNotification;

    notificationModel.severity = notificationModel.severity || 'info';
    notificationModel.timestamp = moment.utc().format('YYYY-MM-DD hh:mm:ss.ms');

    notification = this._createNotification(notificationModel);
    const managerNotification = this.manager.addNotification(notificationModel);

    // Merge manager notification properties
    Object.assign(notification, {
      id: managerNotification.id,
      priority: managerNotification.priority
    });

    this.notifications.push(notification);
    this._setHighestSeverity();

    if (!this.activeNotification && !notification?.model?.options?.minimized) {
      this._setActiveNotification(notification);
    } else if (!this.activeTimeout) {
      this.activeTimeout = setTimeout(() => {
        this._dismissOrMinimize(activeNotification);
      }, DEFAULT_AUTO_DISMISS_TIMEOUT);
    }

    return notification;
  }

  /**
   * @private
   */
  _createNotification(notificationModel) {
    let notification = new EventEmitter();
    notification.model = notificationModel;
    notification.dismiss = () => {
      if (this.manager.dismissNotification(notification.id)) {
        this._dismiss(notification);
      }
    };

    if (Object.prototype.hasOwnProperty.call(notificationModel, 'progressPerc')) {
      notification.progress = (progressPerc, progressText) => {
        notification.model.progressPerc = progressPerc;
        notification.model.progressText = progressText;
        notification.emit('progress', progressPerc, progressText);
      };
    }

    return notification;
  }

  /**
   * @private
   */
  _setHighestSeverity() {
    let severity = {
      info: 1,
      alert: 2,
      error: 3
    };

    this.highest.severity = this.notifications.reduce((previous, notification) => {
      if (severity[notification.model.severity] > severity[previous]) {
        return notification.model.severity;
      } else {
        return previous;
      }
    }, 'info');
  }

  /**
   * @private
   */
  _minimize(notification) {
    if (!notification) {
      return;
    }

    let index = this.notifications.indexOf(notification);

    if (this.activeTimeout) {
      clearTimeout(this.activeTimeout);
      delete this.activeTimeout;
    }

    if (index >= 0) {
      notification.model.minimized = true;
      notification.emit('minimized');

      setTimeout(() => {
        notification.emit('destroy');
        this._setActiveNotification(this._selectNextNotification());
      }, MINIMIZE_ANIMATION_TIMEOUT);
    }
  }

  /**
   * @private
   */
  _dismiss(notification) {
    if (!notification) {
      return;
    }

    let index = this.notifications.indexOf(notification);

    if (this.activeTimeout) {
      clearTimeout(this.activeTimeout);
      delete this.activeTimeout;
    }

    if (index >= 0) {
      this.notifications.splice(index, 1);
    }

    this._setActiveNotification(this._selectNextNotification());
    this._setHighestSeverity();
    notification.emit('destroy');
  }

  /**
   * @private
   */
  _dismissOrMinimize(notification) {
    let model = notification?.model;
    if (model?.severity === 'info') {
      this._dismiss(notification);
    } else {
      this._minimize(notification);
    }
  }

  /**
   * @private
   */
  _setActiveNotification(notification) {
    this.activeNotification = notification;

    if (!notification) {
      delete this.activeTimeout;
      return;
    }

    this.emit('notification', notification);

    if (notification.model.autoDismiss || this._selectNextNotification()) {
      const autoDismissTimeout =
        notification.model.options.autoDismissTimeout || DEFAULT_AUTO_DISMISS_TIMEOUT;
      this.activeTimeout = setTimeout(() => {
        this._dismissOrMinimize(notification);
      }, autoDismissTimeout);
    } else {
      delete this.activeTimeout;
    }
  }

  /**
   * @private
   */
  _selectNextNotification() {
    let notification;
    let i = 0;

    for (; i < this.notifications.length; i++) {
      notification = this.notifications[i];
      const isNotificationMinimized =
        notification.model.minimized || notification?.model?.options?.minimized;

      if (!isNotificationMinimized && notification !== this.activeNotification) {
        return notification;
      }
    }
  }
}
