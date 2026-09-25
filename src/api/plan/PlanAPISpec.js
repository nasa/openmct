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

import PlanAPI from './PlanAPI.js';

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe('PlanAPI execution status requests', () => {
  let api;
  let notifications;
  let provider;
  const plan = { identifier: { namespace: '', key: 'plan' }, type: 'plan' };

  beforeEach(() => {
    notifications = { error: jasmine.createSpy('error') };
    api = new PlanAPI({ notifications });
    provider = {
      supportsExecutionStatus: () => true,
      getExecutionStatus: jasmine.createSpy('getExecutionStatus')
    };
    api.addProvider(provider);
  });

  it('tracks a request until its promise settles', async () => {
    const pending = deferred();
    provider.getExecutionStatus.and.returnValue(pending.promise);
    const request = api.getExecutionStatus(plan);
    expect(api.requestAbortControllers.size).toBe(1);
    const status = { status: 'behind', duration: 1000 };
    pending.resolve(status);
    expect(await request).toEqual(status);
    expect(api.requestAbortControllers.size).toBe(0);
  });

  it('aborts every pending request without affecting later requests', async () => {
    const first = deferred();
    const second = deferred();
    provider.getExecutionStatus.and.returnValues(first.promise, second.promise, Promise.resolve());
    const requests = [api.getExecutionStatus(plan), api.getExecutionStatus(plan)];
    const signals = provider.getExecutionStatus.calls.allArgs().map((args) => args[1].signal);
    api.abortAllRequests();
    expect(signals.every((signal) => signal.aborted)).toBeTrue();
    expect(api.requestAbortControllers.size).toBe(0);
    first.resolve();
    second.resolve();
    await Promise.all(requests);
    await api.getExecutionStatus(plan);
    expect(provider.getExecutionStatus.calls.mostRecent().args[1].signal.aborted).toBeFalse();
  });

  it('reports asynchronous provider errors and preserves the rejection', async () => {
    const error = new Error('provider failed');
    provider.getExecutionStatus.and.returnValue(Promise.reject(error));
    await expectAsync(api.getExecutionStatus(plan)).toBeRejectedWith(error);
    expect(notifications.error).toHaveBeenCalledTimes(1);
    expect(api.requestAbortControllers.size).toBe(0);
  });

  it('does not report cancellation as a provider failure', async () => {
    const error = new DOMException('navigation', 'AbortError');
    provider.getExecutionStatus.and.returnValue(Promise.reject(error));
    await expectAsync(api.getExecutionStatus(plan)).toBeRejectedWith(error);
    expect(notifications.error).not.toHaveBeenCalled();
    expect(api.requestAbortControllers.size).toBe(0);
  });

  it('returns synchronous provider errors as rejections', async () => {
    const error = new Error('synchronous provider failure');
    provider.getExecutionStatus.and.callFake(() => {
      throw error;
    });
    await expectAsync(api.getExecutionStatus(plan)).toBeRejectedWith(error);
    expect(notifications.error).toHaveBeenCalledTimes(1);
    expect(api.requestAbortControllers.size).toBe(0);
  });

  it('supports synchronous status providers', async () => {
    const status = { status: 'nominal', duration: 0 };
    provider.getExecutionStatus.and.returnValue(status);
    expect(await api.getExecutionStatus(plan)).toEqual(status);
    expect(api.requestAbortControllers.size).toBe(0);
  });

  it('resolves undefined when no provider supports the plan', async () => {
    provider.supportsExecutionStatus = () => false;
    expect(await api.getExecutionStatus(plan)).toBeUndefined();
    expect(api.requestAbortControllers.size).toBe(0);
  });
});
