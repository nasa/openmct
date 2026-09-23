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

/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2024, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *****************************************************************************/
import NotificationManager from './NotificationManager';

describe('NotificationManager', () => {
  let notificationManager;

  beforeEach(() => {
    notificationManager = new NotificationManager();
  });

  describe('category management', () => {
    it('initializes with default categories', () => {
      expect(notificationManager.categories.has('info')).toBe(true);
      expect(notificationManager.categories.has('alert')).toBe(true);
      expect(notificationManager.categories.has('error')).toBe(true);
      expect(notificationManager.categories.has('progress')).toBe(true);
    });

    it('allows registering new categories', () => {
      notificationManager.registerCategory('custom');
      expect(notificationManager.categories.has('custom')).toBe(true);
    });

    it('prevents registering duplicate categories', () => {
      expect(() => {
        notificationManager.registerCategory('info');
      }).toThrow();
    });
  });

  describe('notification grouping', () => {
    it('creates notification groups', () => {
      notificationManager.createGroup('test-group');
      expect(notificationManager.groups.has('test-group')).toBe(true);
    });

    it('prevents creating duplicate groups', () => {
      notificationManager.createGroup('test-group');
      expect(() => {
        notificationManager.createGroup('test-group');
      }).toThrow();
    });

    it('adds notifications to groups', () => {
      notificationManager.createGroup('test-group');
      const notification = notificationManager.addNotification({
        message: 'test',
        severity: 'info',
        groupId: 'test-group'
      });

      const groupNotifications = notificationManager.getGroupNotifications('test-group');
      expect(groupNotifications).toContain(
        jasmine.objectContaining({
          id: notification.id
        })
      );
    });
  });

  describe('notification management', () => {
    it('adds notifications with required properties', () => {
      const notification = notificationManager.addNotification({
        message: 'test',
        severity: 'info'
      });

      expect(notification.id).toBeDefined();
      expect(notification.timestamp).toBeDefined();
      expect(notification.status).toBe('active');
      expect(notification.priority).toBeDefined();
    });

    it('calculates priorities correctly', () => {
      const errorNotification = notificationManager.addNotification({
        message: 'error',
        severity: 'error'
      });

      const infoNotification = notificationManager.addNotification({
        message: 'info',
        severity: 'info'
      });

      expect(errorNotification.priority).toBeGreaterThan(infoNotification.priority);
    });

    it('handles persistent notifications', () => {
      const notification = notificationManager.addNotification({
        message: 'test',
        severity: 'info',
        persistent: true
      });

      expect(notificationManager.persistentNotifications.has(notification.id)).toBe(true);
    });
  });

  describe('notification retrieval', () => {
    beforeEach(() => {
      notificationManager.addNotification({
        message: 'test1',
        severity: 'error'
      });
      notificationManager.addNotification({
        message: 'test2',
        severity: 'info'
      });
    });

    it('retrieves active notifications sorted by priority', () => {
      const notifications = notificationManager.getActiveNotifications();
      expect(notifications.length).toBe(2);
      expect(notifications[0].severity).toBe('error');
      expect(notifications[1].severity).toBe('info');
    });
  });

  describe('notification dismissal', () => {
    let notification;

    beforeEach(() => {
      notification = notificationManager.addNotification({
        message: 'test',
        severity: 'info'
      });
    });

    it('dismisses non-persistent notifications', () => {
      const result = notificationManager.dismissNotification(notification.id);
      expect(result).toBe(true);
      expect(notificationManager.notifications.get(notification.id).status).toBe('dismissed');
    });

    it('prevents dismissing persistent notifications', () => {
      const persistentNotification = notificationManager.addNotification({
        message: 'test',
        severity: 'info',
        persistent: true
      });

      const result = notificationManager.dismissNotification(persistentNotification.id);
      expect(result).toBe(false);
      expect(notificationManager.notifications.get(persistentNotification.id).status).toBe(
        'active'
      );
    });
  });
});
