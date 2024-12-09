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

/**
 * This bundle implements the notification service, which can be used to
 * show banner notifications to the user. Banner notifications
 * are used to inform users of events in a non-intrusive way. As
 * much as possible, notifications share a model with blocking
 * dialogs so that the same information can be provided in a dialog
 * and then minimized to a banner notification if needed.
 */
import { EventEmitter } from 'eventemitter3';

import NotificationManager from './NotificationManager';

export default class NotificationAPI extends EventEmitter {
  constructor() {
    super();
    this.manager = new NotificationManager();
  }

  info(message, options = {}) {
    return this.manager.addNotification({
      message,
      severity: 'info',
      autoDismiss: true,
      ...options
    });
  }

  alert(message, options = {}) {
    return this.manager.addNotification({
      message,
      severity: 'alert',
      ...options
    });
  }

  error(message, options = {}) {
    return this.manager.addNotification({
      message,
      severity: 'error',
      ...options
    });
  }

  // New method to create notification groups
  createGroup(groupId, options = {}) {
    return this.manager.createGroup(groupId, options);
  }

  // New method to add notifications to a group
  groupedNotification(groupId, message, options = {}) {
    return this.manager.addNotification({
      message,
      groupId,
      ...options
    });
  }

  // New method to register custom notification categories
  registerCategory(category, options = {}) {
    return this.manager.registerCategory(category, options);
  }

  // Get all active notifications
  getActiveNotifications() {
    return this.manager.getActiveNotifications();
  }

  // Get notifications for a specific group
  getGroupNotifications(groupId) {
    return this.manager.getGroupNotifications(groupId);
  }

  dismissNotification(notification) {
    return this.manager.dismissNotification(notification.id);
  }

  dismissGroup(groupId) {
    return this.manager.dismissGroup(groupId);
  }
}
