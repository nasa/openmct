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
import { h, nextTick } from 'vue';

import mount from '@/utils/mount';
import { createOpenMct, resetApplicationState } from '@/utils/testing';

import { PLAN_EXECUTION_MONITORING_KEY } from '../planExecutionMonitoring/planExecutionMonitoringIdentifier.js';
import getDefaultConfiguration from './configuration.js';
import TimelinePlugin from './plugin.js';
import TimelineViewLayout from './TimelineViewLayout.vue';

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

async function flushRequests() {
  await new Promise((resolve) => setTimeout(resolve, 0));
  await nextTick();
}

describe('Timeline execution monitoring lifecycle', () => {
  let openmct;
  let composition;
  let view;
  let component;
  let provider;
  let requests;
  let unsubscribe;
  let objects;
  let planA;
  let planB;

  beforeEach(async () => {
    openmct = createOpenMct();
    openmct.install(openmct.plugins.PlanLayout());
    openmct.install(new TimelinePlugin());
    await new Promise((resolve) => {
      openmct.on('start', resolve);
      openmct.startHeadless();
    });
    planA = {
      identifier: { namespace: '', key: 'plan-a' },
      type: 'plan',
      selectFile: { body: '{}' }
    };
    planB = { ...planA, identifier: { namespace: '', key: 'plan-b' } };
    objects = { 'plan-a': planA, 'plan-b': planB };
    requests = [];
    unsubscribe = jasmine.createSpy('unsubscribe');
    provider = {
      supportsExecutionStatus: () => true,
      getExecutionStatus: jasmine.createSpy('getExecutionStatus').and.callFake(() => {
        const request = deferred();
        requests.push(request);
        return request.promise;
      }),
      subscribeForExecutionStatus: jasmine
        .createSpy('subscribeForExecutionStatus')
        .and.returnValue(unsubscribe)
    };
    openmct.plan.addProvider(provider);
    composition = new EventEmitter();
    composition.load = () => Promise.resolve([]);
    const timeline = {
      identifier: { namespace: '', key: 'timeline' },
      type: 'time-strip',
      composition: [],
      configuration: getDefaultConfiguration()
    };
    spyOn(openmct.composition, 'get').and.returnValue(composition);
    spyOn(openmct.objects, 'get').and.callFake((id) => Promise.resolve(objects[id]));
    spyOn(openmct.objects, 'mutate');
    view = mount({
      components: {
        TimelineViewLayout: {
          ...TimelineViewLayout,
          // Exercise the actual setup/lifecycle without mounting child plan views.
          render() {
            return h('div', { ref: 'timelineHolder' });
          }
        }
      },
      provide: {
        openmct,
        domainObject: timeline,
        path: [timeline],
        extendedLinesBus: new EventTarget()
      },
      template: '<timeline-view-layout ref="timeline" />'
    });
    component = view.vNode.componentInstance.$refs.timeline;
    await flushRequests();
  });

  afterEach(async () => {
    view?.destroy();
    requests.forEach((request) => request.resolve());
    await flushRequests();
    await resetApplicationState(openmct);
  });

  it('keeps only the newest request and releases its subscription on unmount', async () => {
    composition.emit('add', planA);
    await flushRequests();
    composition.emit('add', planB);
    await flushRequests();
    expect(requests.length).toBe(2);
    const latest = { status: 'ahead', duration: 2000 };
    requests[1].resolve(latest);
    await flushRequests();
    requests[0].resolve({ status: 'behind', duration: 1000 });
    await flushRequests();
    expect(component.aheadBehind).toEqual(latest);
    view.destroy();
    view = undefined;
    expect(unsubscribe).toHaveBeenCalledTimes(1);
    expect(Object.keys(openmct.plan.executionMonitoringSubscribeCache ?? {})).toEqual([]);
  });

  it('does not subscribe when a request finishes after unmount', async () => {
    composition.emit('add', planA);
    await flushRequests();
    view.destroy();
    view = undefined;
    requests[0].resolve({ status: 'ahead', duration: 1000 });
    await flushRequests();
    expect(provider.subscribeForExecutionStatus).not.toHaveBeenCalled();
  });

  it('ignores a plan lookup that finishes after unmount', async () => {
    const lookup = deferred();
    openmct.objects.get.and.returnValue(lookup.promise);
    composition.emit('add', planA);
    await flushRequests();
    view.destroy();
    view = undefined;
    lookup.resolve(planA);
    await flushRequests();
    expect(provider.getExecutionStatus).not.toHaveBeenCalled();
  });

  it('does not restore monitoring after the last plan is removed', async () => {
    composition.emit('add', planA);
    await flushRequests();
    composition.emit('remove', planA.identifier);
    requests[0].resolve({ status: 'behind', duration: 1000 });
    await flushRequests();
    expect(provider.subscribeForExecutionStatus).not.toHaveBeenCalled();
    expect(component.aheadBehind).toEqual({ status: '', duration: 0 });
  });

  it('releases a subscription only once when plans are removed and the view closes', async () => {
    composition.emit('add', planA);
    await flushRequests();
    requests[0].resolve({ status: 'nominal', duration: 0 });
    await flushRequests();
    composition.emit('remove', planA.identifier);
    view.destroy();
    view = undefined;
    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });

  it('ignores a pending legacy persistence lookup after unmount', async () => {
    provider.supportsExecutionStatus = () => false;
    const persisted = deferred();
    openmct.objects.get.and.callFake((id) =>
      id === PLAN_EXECUTION_MONITORING_KEY ? persisted.promise : Promise.resolve(objects[id])
    );
    const statusObject = {
      identifier: { key: PLAN_EXECUTION_MONITORING_KEY, namespace: '' },
      execution_monitoring: {}
    };
    spyOn(openmct.objects, 'observe').and.returnValue(unsubscribe);
    composition.emit('add', planA);
    await flushRequests();
    view.destroy();
    view = undefined;
    persisted.resolve(statusObject);
    await flushRequests();
    expect(openmct.objects.observe).not.toHaveBeenCalledWith(
      statusObject,
      '*',
      jasmine.any(Function)
    );
  });

  it('applies live provider updates while the subscription is current', async () => {
    composition.emit('add', planA);
    await flushRequests();
    requests[0].resolve({ status: 'nominal', duration: 0 });
    await flushRequests();
    const callback = provider.subscribeForExecutionStatus.calls.mostRecent().args[1];
    callback({ status: 'behind', duration: 3000 });
    expect(component.aheadBehind).toEqual({ status: 'behind', duration: 3000 });
  });

  it('handles a rejected status request without subscribing', async () => {
    spyOn(console, 'error');
    spyOn(openmct.notifications, 'error');
    composition.emit('add', planA);
    await flushRequests();
    const error = new Error('status unavailable');
    requests[0].reject(error);
    await flushRequests();
    expect(provider.subscribeForExecutionStatus).not.toHaveBeenCalled();
    expect(component.aheadBehind).toEqual({ status: '', duration: 0 });
    expect(openmct.notifications.error).toHaveBeenCalledTimes(1);
    expect(console.error).toHaveBeenCalledWith(error);
  });

  it('handles cancellation without error notifications', async () => {
    spyOn(console, 'error');
    spyOn(openmct.notifications, 'error');
    composition.emit('add', planA);
    await flushRequests();
    requests[0].reject(new DOMException('navigation', 'AbortError'));
    await flushRequests();
    expect(provider.subscribeForExecutionStatus).not.toHaveBeenCalled();
    expect(openmct.notifications.error).not.toHaveBeenCalled();
    expect(console.error).not.toHaveBeenCalled();
  });

  it('retains legacy updates and releases their observer on unmount', async () => {
    provider.supportsExecutionStatus = () => false;
    const status = { status: 'ahead', duration: 4000 };
    const statusObject = {
      identifier: { key: PLAN_EXECUTION_MONITORING_KEY, namespace: '' },
      execution_monitoring: { 'plan-a': status }
    };
    objects[PLAN_EXECUTION_MONITORING_KEY] = statusObject;
    spyOn(openmct.objects, 'observe').and.returnValue(unsubscribe);
    composition.emit('add', planA);
    await flushRequests();
    expect(component.aheadBehind).toEqual(status);
    const callback = openmct.objects.observe.calls.mostRecent().args[2];
    callback({ execution_monitoring: { 'plan-a': { status: 'nominal', duration: 0 } } });
    expect(component.aheadBehind).toEqual({ status: 'nominal', duration: 0 });
    view.destroy();
    view = undefined;
    expect(unsubscribe).toHaveBeenCalledTimes(1);
    callback(statusObject);
    expect(component.aheadBehind).toEqual({ status: 'nominal', duration: 0 });
  });

  ['removed', 'unmounted'].forEach((event) => {
    it(`ignores a nested plan discovered after its chart is ${event}`, async () => {
      const loaded = deferred();
      const chart = {
        identifier: { namespace: '', key: 'chart' },
        type: 'gantt-chart',
        configuration: { swimlaneVisibility: {} }
      };
      const chartComposition = {
        load: () => loaded.promise,
        forEach: (callback) => callback(planA)
      };
      openmct.composition.get.and.callFake((obj) =>
        obj === chart ? chartComposition : composition
      );
      composition.emit('add', chart);
      if (event === 'removed') {
        composition.emit('remove', chart.identifier);
      } else {
        view.destroy();
        view = undefined;
      }
      loaded.resolve();
      await flushRequests();
      expect(provider.getExecutionStatus).not.toHaveBeenCalled();
    });
  });
});
