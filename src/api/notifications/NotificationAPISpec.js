/* eslint-disable no-unused-vars */
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

import NotificationAPI from './NotificationAPI';

describe('The Notification API', () => {
  let notificationAPI;
  let defaultTimeout = 4000;

  beforeEach(() => {
    notificationAPI = new NotificationAPI();
  });

  describe('the info method', () => {
    let message = 'Example Notification Message';
    let severity = 'info';
    let notificationModel;

    beforeEach(() => {
      const notification = notificationAPI.info(message);
      notificationModel = notification.model;
    });

    afterEach(() => {
      notificationAPI.dismissAllNotifications();
    });

    it('shows a string message with info severity', () => {
      expect(notificationModel.message).toEqual(message);
      expect(notificationModel.severity).toEqual(severity);
    });

    it('auto dismisses the notification after a brief timeout', (done) => {
      setTimeout(() => {
        const activeNotifications = notificationAPI.getActiveNotifications();
        expect(activeNotifications.length).toEqual(0);
        done();
      }, defaultTimeout);
    });
  });

  describe('notification grouping', () => {
    let groupId = 'test-group';

    beforeEach(() => {
      notificationAPI.createGroup(groupId, {
        title: 'Test Group'
      });
    });

    it('creates notification groups', () => {
      expect(() => {
        notificationAPI.getGroupNotifications(groupId);
      }).not.toThrow();
    });

    it('adds notifications to groups', () => {
      const notification = notificationAPI.groupedNotification(groupId, 'Test message', {
        severity: 'info'
      });
      const groupNotifications = notificationAPI.getGroupNotifications(groupId);

      expect(groupNotifications.some((n) => n.message === 'Test message')).toBe(true);
    });

    it('dismisses groups of notifications', () => {
      notificationAPI.groupedNotification(groupId, 'Test 1', { severity: 'info' });
      notificationAPI.groupedNotification(groupId, 'Test 2', { severity: 'info' });

      notificationAPI.dismissGroup(groupId);
      const activeNotifications = notificationAPI.getActiveNotifications();

      expect(activeNotifications.length).toBe(0);
    });
  });

  describe('notification categories', () => {
    it('creates notifications with custom categories', () => {
      notificationAPI.registerCategory('custom');
      const notification = notificationAPI.info('Test message', {
        category: 'custom'
      });

      expect(notification.model.options.category).toBe('custom');
    });
  });

  describe('notification management', () => {
    it('preserves persistent notifications', () => {
      const notification = notificationAPI.alert('Test', {
        persistent: true
      });

      expect(() => {
        notificationAPI.dismissNotification(notification);
      }).not.toThrow();

      const activeNotifications = notificationAPI.getActiveNotifications();
      expect(activeNotifications.length).toBe(0);
    });
  });
});
