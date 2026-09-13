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

import { once } from 'node:events';

import { WebSocketServer } from 'ws';

import { expect, test } from '../../pluginFixtures.js';

test.describe('Telemetry WebSocket worker', () => {
  let server;
  let received;
  let pageErrors;

  test.beforeEach(async ({ page }) => {
    received = [];
    pageErrors = [];
    // Playwright's WebSocket routing does not intercept sockets inside this worker.
    server = new WebSocketServer({ host: '127.0.0.1', port: 0 });
    await once(server, 'listening');
    server.on('connection', (socket) => {
      socket.on('message', (message) => {
        received.push(message.toString());
        socket.send(message.toString());
      });
    });
    page.on('pageerror', (error) => pageErrors.push(error.message));

    await page.goto('./', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('button', { name: 'Create', exact: true })).toBeVisible();
    await page.evaluate((url) => {
      const openmct = window.openmct;
      const socket = new openmct.telemetry.BatchingWebSocket(openmct);
      const state = { socket, messages: [], reconnections: 0 };
      window.batchingSocketTest = state;
      socket.addEventListener('batch', (event) => state.messages.push(...event.detail));
      socket.addEventListener('reconnected', () => state.reconnections++);
      socket.setThrottleRate(25);
      socket.sendMessage('queued before connection');
      socket.connect(url);
    }, `ws://127.0.0.1:${server.address().port}/`);

    // Include worker errors in the failure, so a bootstrap error is not just a timeout.
    await expect
      .poll(() => ({ pageErrors, received }))
      .toEqual({
        pageErrors: [],
        received: ['queued before connection']
      });
    await expect
      .poll(() => page.evaluate(() => window.batchingSocketTest.messages))
      .toEqual(['queued before connection']);
  });

  test.afterEach(async ({ page }) => {
    const closed = Promise.all(Array.from(server.clients, (socket) => once(socket, 'close')));
    try {
      await page.evaluate(() => window.batchingSocketTest?.socket.disconnect());
      await closed;
    } finally {
      for (const socket of server.clients) {
        socket.terminate();
      }

      await new Promise((resolve) => server.close(resolve));
    }

    expect(pageErrors).toEqual([]);
  });

  test('delivers queued and live messages once through the worker', async ({ page }) => {
    await page.evaluate(() => window.batchingSocketTest.socket.sendMessage('live telemetry'));
    await expect
      .poll(() => page.evaluate(() => window.batchingSocketTest.messages))
      .toEqual(['queued before connection', 'live telemetry']);
    expect(received).toEqual(['queued before connection', 'live telemetry']);
  });

  test('resumes telemetry delivery after repeated connection losses', async ({ page }) => {
    const expectedMessages = ['queued before connection'];
    for (let cycle = 1; cycle <= 3; cycle++) {
      const nextConnection = once(server, 'connection');
      for (const socket of server.clients) {
        socket.close(1012, 'Test server restart');
      }

      await nextConnection;
      await expect
        .poll(() => page.evaluate(() => window.batchingSocketTest.reconnections))
        .toBe(cycle);
      const message = `telemetry after reconnect ${cycle}`;
      expectedMessages.push(message);
      await page.evaluate((value) => window.batchingSocketTest.socket.sendMessage(value), message);
      await expect
        .poll(() => page.evaluate(() => window.batchingSocketTest.messages))
        .toEqual(expectedMessages);
      expect(received).toEqual(expectedMessages);
    }
  });

  test('preserves control messages when the telemetry buffer overflows', async ({ page }) => {
    await page.evaluate(() => {
      const socket = window.batchingSocketTest.socket;
      socket.setThrottleMessagePattern('^telemetry:');
      socket.setMaxBufferSize(0);
      socket.sendMessage('telemetry:discard this value');
      socket.sendMessage('control:keep this message');
    });
    await expect
      .poll(() => page.evaluate(() => window.batchingSocketTest.messages))
      .toEqual(['queued before connection', 'control:keep this message']);
    await expect(
      page.getByText('Telemetry dropped due to buffer overflow.', { exact: true })
    ).toBeVisible();
  });
});
