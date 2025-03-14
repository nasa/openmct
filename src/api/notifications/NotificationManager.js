/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2024, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *****************************************************************************/

export default class NotificationManager {
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
    const id = Math.random().toString(36).substr(2, 9); // Simple ID generation
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

  _calculatePriority(notification) {
    let priority = 0;

    const severityWeights = {
      error: 100,
      alert: 50,
      info: 10
    };
    priority += severityWeights[notification.severity] || 0;

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

  getActiveNotifications() {
    return Array.from(this.notifications.values())
      .filter((n) => n.status === 'active')
      .sort((a, b) => b.priority - a.priority);
  }

  getGroupNotifications(groupId) {
    const group = this.groups.get(groupId);
    if (!group) {
      return [];
    }

    return Array.from(group.notifications)
      .map((id) => this.notifications.get(id))
      .filter(Boolean);
  }

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
