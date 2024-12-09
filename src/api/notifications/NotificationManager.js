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

// eslint-disable-next-line no-unused-vars
class NotificationManager {
  constructor() {
    this.notifications = new Map(); // Key: notificationId, Value: notification
    this.categories = new Set(['info', 'alert', 'error', 'progress']); // Default categories
    this.groups = new Map(); // For grouping related notifications
    this.persistentNotifications = new Set(); // For notifications that should persist
  }

  // Allow registering custom notification categories
  registerCategory(category, options = {}) {
    if (this.categories.has(category)) {
      throw new Error(`Category ${category} already exists`);
    }
    this.categories.add(category);
  }

  // Create a notification group
  createGroup(groupId, options = {}) {
    if (this.groups.has(groupId)) {
      throw new Error(`Group ${groupId} already exists`);
    }
    this.groups.set(groupId, {
      notifications: new Set(),
      ...options
    });
  }

  // Add a notification to the system
  addNotification(notification) {
    const id = crypto.randomUUID();
    const timestamp = Date.now();

    const enrichedNotification = {
      ...notification,
      id,
      timestamp,
      status: 'active',
      priority: this._calculatePriority(notification)
    };

    this.notifications.set(id, enrichedNotification);

    if (notification.groupId && this.groups.has(notification.groupId)) {
      this.groups.get(notification.groupId).notifications.add(id);
    }

    if (notification.persistent) {
      this.persistentNotifications.add(id);
    }

    return enrichedNotification;
  }

  // Calculate notification priority based on multiple factors
  _calculatePriority(notification) {
    let priority = 0;

    // Base priority from severity
    const severityWeights = {
      error: 100,
      alert: 50,
      info: 10
    };
    priority += severityWeights[notification.severity] || 0;

    // Additional priority factors
    if (notification.persistent) {
      priority += 20;
    }
    if (notification.groupId) {
      priority += 10;
    }
    if (notification.category === 'system') {
      priority += 30;
    }

    return priority;
  }

  // Get active notifications sorted by priority
  getActiveNotifications() {
    return Array.from(this.notifications.values())
      .filter((n) => n.status === 'active')
      .sort((a, b) => b.priority - a.priority);
  }

  // Get notifications by group
  getGroupNotifications(groupId) {
    const group = this.groups.get(groupId);
    if (!group) {
      return [];
    }

    return Array.from(group.notifications)
      .map((id) => this.notifications.get(id))
      .filter(Boolean);
  }

  // Dismiss a notification
  dismissNotification(id) {
    const notification = this.notifications.get(id);
    if (!notification) {
      return false;
    }

    if (this.persistentNotifications.has(id)) {
      return false;
    }

    notification.status = 'dismissed';
    return true;
  }

  // Dismiss all notifications in a group
  dismissGroup(groupId) {
    const group = this.groups.get(groupId);
    if (!group) {
      return;
    }

    group.notifications.forEach((id) => {
      this.dismissNotification(id);
    });
  }
}
