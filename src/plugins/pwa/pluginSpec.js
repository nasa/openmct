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

import { createOpenMct, resetApplicationState } from 'utils/testing';

import PWAPlugin from './plugin.js';
import { SKIP_WAITING_MESSAGE_TYPE } from './serviceWorkerHandlers.js';
import ServiceWorkerManager, { UPDATE_AVAILABLE_MESSAGE } from './ServiceWorkerManager.js';

const IN_SCOPE_SERVICE_WORKER_URL = '/serviceWorker.js';

function createFakeServiceWorker(state) {
  const worker = new EventTarget();
  worker.state = state;
  worker.postMessage = jasmine.createSpy('postMessage');
  worker.setState = (newState) => {
    worker.state = newState;
    worker.dispatchEvent(new Event('statechange'));
  };

  return worker;
}

function createFakeRegistration() {
  const registration = new EventTarget();
  registration.installing = null;
  registration.waiting = null;
  registration.active = null;
  registration.update = jasmine.createSpy('update').and.returnValue(Promise.resolve());
  registration.startInstalling = (worker) => {
    registration.installing = worker;
    registration.dispatchEvent(new Event('updatefound'));
  };

  return registration;
}

function createFakeContainer(registration) {
  const container = new EventTarget();
  container.controller = null;
  container.register = jasmine
    .createSpy('register')
    .and.callFake(() => Promise.resolve(registration));

  return container;
}

describe('The PWA plugin', () => {
  let openmct;
  let registration;
  let container;

  let manager;

  function installAndStart(options) {
    manager = new ServiceWorkerManager(openmct, {
      serviceWorkerUrl: IN_SCOPE_SERVICE_WORKER_URL,
      updateCheckInterval: 0,
      serviceWorkerContainer: container,
      ...options
    });

    return manager.register();
  }

  beforeEach(() => {
    openmct = createOpenMct();
    registration = createFakeRegistration();
    container = createFakeContainer(registration);
    spyOn(openmct.notifications, 'alert').and.callThrough();
    spyOn(console, 'info');
    spyOn(console, 'warn');
  });

  afterEach(() => {
    manager?.destroy();
    manager = undefined;

    return resetApplicationState(openmct);
  });

  it('is exposed as openmct.plugins.PWA', () => {
    expect(openmct.plugins.PWA).toBe(PWAPlugin);
  });

  it('registers the service worker once the application has started', async () => {
    openmct.install(
      PWAPlugin({
        serviceWorkerUrl: IN_SCOPE_SERVICE_WORKER_URL,
        updateCheckInterval: 0,
        serviceWorkerContainer: container
      })
    );
    expect(container.register).not.toHaveBeenCalled();

    await openmct.startHeadless();
    await new Promise((resolve) => setTimeout(resolve));

    expect(container.register).toHaveBeenCalledOnceWith(
      `${window.location.origin}${IN_SCOPE_SERVICE_WORKER_URL}`,
      { scope: `${window.location.origin}/`, updateViaCache: 'none' }
    );
  });

  it('derives the default service worker URL from the asset path', async () => {
    await installAndStart({ serviceWorkerUrl: undefined, scope: '/' });

    expect(container.register.calls.mostRecent().args[0]).toBe(
      `${window.location.origin}/base/${__OPENMCT_ROOT_RELATIVE__}serviceWorker.js`
    );
  });

  it('does not register when the page is outside the service worker scope', async () => {
    await installAndStart({ serviceWorkerUrl: '/some/other/directory/serviceWorker.js' });

    expect(container.register).not.toHaveBeenCalled();
    expect(console.info).toHaveBeenCalledWith(jasmine.stringMatching(/outside its scope/));
  });

  it('does nothing when service workers are unsupported', async () => {
    await installAndStart({ serviceWorkerContainer: undefined });

    expect(console.info).toHaveBeenCalledWith(jasmine.stringMatching(/not supported/));
  });

  it('warns rather than throws when registration fails', async () => {
    container.register.and.callFake(() => Promise.reject(new Error('nope')));

    await installAndStart();

    expect(console.warn).toHaveBeenCalledWith(
      jasmine.stringMatching(/Unable to register service worker/),
      jasmine.any(Error)
    );
  });

  it('does not notify about the very first install', async () => {
    await installAndStart();
    const worker = createFakeServiceWorker('installing');
    registration.startInstalling(worker);
    worker.setState('installed');

    expect(openmct.notifications.alert).not.toHaveBeenCalled();
  });

  it('notifies once when a new build has been installed behind a controlling worker', async () => {
    await installAndStart();
    container.controller = createFakeServiceWorker('activated');
    const worker = createFakeServiceWorker('installing');
    registration.startInstalling(worker);
    worker.setState('installed');
    worker.setState('installed');

    expect(openmct.notifications.alert).toHaveBeenCalledTimes(1);
    expect(openmct.notifications.alert).toHaveBeenCalledWith(
      UPDATE_AVAILABLE_MESSAGE,
      jasmine.objectContaining({
        link: jasmine.objectContaining({ onClick: jasmine.any(Function) })
      })
    );
  });

  it('notifies about a build that was already waiting when the page loaded', async () => {
    container.controller = createFakeServiceWorker('activated');
    registration.waiting = createFakeServiceWorker('installed');

    await installAndStart();

    expect(openmct.notifications.alert).toHaveBeenCalledTimes(1);
  });

  it('can suppress the update notification', async () => {
    container.controller = createFakeServiceWorker('activated');
    registration.waiting = createFakeServiceWorker('installed');

    await installAndStart({ notifyOnUpdate: false });

    expect(openmct.notifications.alert).not.toHaveBeenCalled();
  });

  it('asks the waiting worker to take over when the reload link is clicked', async () => {
    container.controller = createFakeServiceWorker('activated');
    registration.waiting = createFakeServiceWorker('installed');
    await installAndStart();

    const { link } = openmct.notifications.alert.calls.mostRecent().args[1];
    link.onClick();

    expect(registration.waiting.postMessage).toHaveBeenCalledWith({
      type: SKIP_WAITING_MESSAGE_TYPE
    });
  });

  it('checks for updates periodically', async () => {
    jasmine.clock().install();
    try {
      await installAndStart({ updateCheckInterval: 1000 });

      jasmine.clock().tick(2500);
      expect(registration.update).toHaveBeenCalledTimes(2);

      manager.destroy();
      jasmine.clock().tick(5000);
      expect(registration.update).toHaveBeenCalledTimes(2);
    } finally {
      jasmine.clock().uninstall();
    }
  });
});
