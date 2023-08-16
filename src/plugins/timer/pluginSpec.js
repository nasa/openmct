/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2023, United States Government
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

import { createOpenMct, spyOnBuiltins, resetApplicationState } from 'utils/testing';
import timerPlugin from './plugin';

import Vue from 'vue';

xdescribe('Timer plugin:', () => {
  let openmct;
  let timerDefinition;
  let element;
  let child;
  let appHolder;

  let timerDomainObject;

  function setupTimer() {
    return new Promise((resolve, reject) => {
      timerDomainObject = {
        identifier: {
          key: 'timer',
          namespace: 'test-namespace'
        },
        type: 'timer'
      };

      appHolder = document.createElement('div');
      appHolder.style.width = '640px';
      appHolder.style.height = '480px';
      document.body.appendChild(appHolder);

      openmct = createOpenMct();

      element = document.createElement('div');
      child = document.createElement('div');
      element.appendChild(child);

      openmct.install(timerPlugin());

      timerDefinition = openmct.types.get('timer').definition;
      timerDefinition.initialize(timerDomainObject);

      spyOn(openmct.objects, 'supportsMutation').and.returnValue(true);

      openmct.on('start', resolve);
      openmct.start(appHolder);
    });
  }

  afterEach(() => {
    return resetApplicationState(openmct);
  });

  describe("should still work if it's in the old format", () => {
    let timerViewProvider;
    let timerView;
    let timerViewObject;
    let mutableTimerObject;
    let timerObjectPath;
    const relativeTimestamp = 1634774400000; // Oct 21 2021, 12:00 AM

    beforeEach(async () => {
      await setupTimer();

      timerViewObject = {
        identifier: {
          key: 'timer',
          namespace: 'test-namespace'
        },
        type: 'timer',
        id: 'test-object',
        name: 'Timer',
        timerFormat: 'short',
        timestamp: relativeTimestamp,
        timerState: 'paused',
        pausedTime: relativeTimestamp
      };

      const applicableViews = openmct.objectViews.get(timerViewObject, [timerViewObject]);
      timerViewProvider = applicableViews.find((viewProvider) => viewProvider.key === 'timer.view');

      spyOn(openmct.objects, 'get').and.returnValue(Promise.resolve(timerViewObject));
      spyOn(openmct.objects, 'save').and.returnValue(Promise.resolve(true));

      mutableTimerObject = await openmct.objects.getMutable(timerViewObject.identifier);

      timerObjectPath = [mutableTimerObject];
      timerView = timerViewProvider.view(mutableTimerObject, timerObjectPath);
      timerView.show(child);

      await Vue.nextTick();
    });

    afterEach(() => {
      timerView.destroy();
    });

    it('should migrate old object properties to the configuration section', () => {
      openmct.objects.applyGetInterceptors(timerViewObject.identifier, timerViewObject);
      expect(timerViewObject.configuration.timerFormat).toBe('short');
      expect(timerViewObject.configuration.timestamp).toBe(relativeTimestamp);
      expect(timerViewObject.configuration.timerState).toBe('paused');
      expect(timerViewObject.configuration.pausedTime).toBe(relativeTimestamp);
    });
  });

  describe('Timer view:', () => {
    let timerViewProvider;
    let timerView;
    let timerViewObject;
    let mutableTimerObject;
    let timerObjectPath;

    beforeEach(async () => {
      await setupTimer();

      spyOnBuiltins(['requestAnimationFrame']);
      window.requestAnimationFrame.and.callFake((cb) => setTimeout(cb, 500));
      const baseTimestamp = 1634688000000; // Oct 20, 2021, 12:00 AM
      const relativeTimestamp = 1634774400000; // Oct 21 2021, 12:00 AM

      jasmine.clock().install();
      const baseTime = new Date(baseTimestamp);
      jasmine.clock().mockDate(baseTime);

      timerViewObject = {
        ...timerDomainObject,
        id: 'test-object',
        name: 'Timer',
        configuration: {
          timerFormat: 'long',
          timestamp: relativeTimestamp,
          timezone: 'UTC',
          timerState: undefined,
          pausedTime: undefined
        }
      };

      spyOn(openmct.objects, 'get').and.returnValue(Promise.resolve(timerViewObject));
      spyOn(openmct.objects, 'save').and.returnValue(Promise.resolve(true));

      const applicableViews = openmct.objectViews.get(timerViewObject, [timerViewObject]);
      timerViewProvider = applicableViews.find((viewProvider) => viewProvider.key === 'timer.view');

      mutableTimerObject = await openmct.objects.getMutable(timerViewObject.identifier);

      timerObjectPath = [mutableTimerObject];
      timerView = timerViewProvider.view(mutableTimerObject, timerObjectPath);
      timerView.show(child);

      await Vue.nextTick();
    });

    afterEach(() => {
      jasmine.clock().uninstall();
      timerView.destroy();
      openmct.objects.destroyMutable(mutableTimerObject);
      if (appHolder) {
        appHolder.remove();
      }
    });

    it('has name as Timer', () => {
      expect(timerDefinition.name).toEqual('Timer');
    });

    it('is creatable', () => {
      expect(timerDefinition.creatable).toEqual(true);
    });

    it('provides timer view', () => {
      expect(timerViewProvider).toBeDefined();
    });

    it('renders timer element', () => {
      const timerElement = element.querySelectorAll('.c-timer');
      expect(timerElement.length).toBe(1);
    });

    it('renders major elements', () => {
      const timerElement = element.querySelector('.c-timer');
      const resetButton = timerElement.querySelector('.c-timer__ctrl-reset');
      const pausePlayButton = timerElement.querySelector('.c-timer__ctrl-pause-play');
      const timerDirectionIcon = timerElement.querySelector('.c-timer__direction');
      const timerValue = timerElement.querySelector('.c-timer__value');
      const hasMajorElements = Boolean(
        resetButton && pausePlayButton && timerDirectionIcon && timerValue
      );

      expect(hasMajorElements).toBe(true);
    });

    it('gets errors from actions if configuration is not passed', async () => {
      await Vue.nextTick();
      const objectPath = _.cloneDeep(timerObjectPath);
      delete objectPath[0].configuration;

      let action = openmct.actions.getAction('timer.start');
      let actionResults = action.invoke(objectPath);
      let actionFilterWithoutConfig = action.appliesTo(objectPath);
      await openmct.objects.mutate(timerObjectPath[0], 'configuration', { timerState: 'started' });
      let actionFilterWithConfig = action.appliesTo(timerObjectPath);

      let actionError = new Error('Unable to run start timer action. No domainObject provided.');
      expect(actionResults).toEqual(actionError);
      expect(actionFilterWithoutConfig).toBe(undefined);
      expect(actionFilterWithConfig).toBe(false);

      action = openmct.actions.getAction('timer.stop');
      actionResults = action.invoke(objectPath);
      actionFilterWithoutConfig = action.appliesTo(objectPath);
      await openmct.objects.mutate(timerObjectPath[0], 'configuration', { timerState: 'stopped' });
      actionFilterWithConfig = action.appliesTo(timerObjectPath);

      actionError = new Error('Unable to run stop timer action. No domainObject provided.');
      expect(actionResults).toEqual(actionError);
      expect(actionFilterWithoutConfig).toBe(undefined);
      expect(actionFilterWithConfig).toBe(false);

      action = openmct.actions.getAction('timer.pause');
      actionResults = action.invoke(objectPath);
      actionFilterWithoutConfig = action.appliesTo(objectPath);
      await openmct.objects.mutate(timerObjectPath[0], 'configuration', { timerState: 'paused' });
      actionFilterWithConfig = action.appliesTo(timerObjectPath);

      actionError = new Error('Unable to run pause timer action. No domainObject provided.');
      expect(actionResults).toEqual(actionError);
      expect(actionFilterWithoutConfig).toBe(undefined);
      expect(actionFilterWithConfig).toBe(false);

      action = openmct.actions.getAction('timer.restart');
      actionResults = action.invoke(objectPath);
      actionFilterWithoutConfig = action.appliesTo(objectPath);
      await openmct.objects.mutate(timerObjectPath[0], 'configuration', { timerState: 'stopped' });
      actionFilterWithConfig = action.appliesTo(timerObjectPath);

      actionError = new Error('Unable to run restart timer action. No domainObject provided.');
      expect(actionResults).toEqual(actionError);
      expect(actionFilterWithoutConfig).toBe(undefined);
      expect(actionFilterWithConfig).toBe(false);
    });

    it('displays a started timer ticking down to a future date', async () => {
      const newBaseTime = 1634774400000; // Oct 21 2021, 12:00 AM
      openmct.objects.mutate(timerViewObject, 'configuration.timestamp', newBaseTime);

      jasmine.clock().tick(5000);
      await Vue.nextTick();

      const timerElement = element.querySelector('.c-timer');
      const timerPausePlayButton = timerElement.querySelector('.c-timer__ctrl-pause-play');
      const timerDirectionIcon = timerElement.querySelector('.c-timer__direction');
      const timerValue = timerElement.querySelector('.c-timer__value').innerText;

      expect(timerPausePlayButton.classList.contains('icon-pause')).toBe(true);
      expect(timerDirectionIcon.classList.contains('icon-minus')).toBe(true);
      expect(timerValue).toBe('0D 23:59:55');
    });

    it('displays a started timer ticking up from a past date', async () => {
      const newBaseTime = 1634601600000; // Oct 19, 2021, 12:00 AM
      openmct.objects.mutate(timerViewObject, 'configuration.timestamp', newBaseTime);

      jasmine.clock().tick(5000);
      await Vue.nextTick();

      const timerElement = element.querySelector('.c-timer');
      const timerPausePlayButton = timerElement.querySelector('.c-timer__ctrl-pause-play');
      const timerDirectionIcon = timerElement.querySelector('.c-timer__direction');
      const timerValue = timerElement.querySelector('.c-timer__value').innerText;

      expect(timerPausePlayButton.classList.contains('icon-pause')).toBe(true);
      expect(timerDirectionIcon.classList.contains('icon-plus')).toBe(true);
      expect(timerValue).toBe('1D 00:00:05');
    });

    it('displays a paused timer correctly in the DOM', async () => {
      jasmine.clock().tick(5000);
      await Vue.nextTick();

      let action = openmct.actions.getAction('timer.pause');
      if (action) {
        action.invoke(timerObjectPath, timerView);
      }

      await Vue.nextTick();
      const timerElement = element.querySelector('.c-timer');
      const timerPausePlayButton = timerElement.querySelector('.c-timer__ctrl-pause-play');
      let timerValue = timerElement.querySelector('.c-timer__value').innerText;

      expect(timerPausePlayButton.classList.contains('icon-play')).toBe(true);
      expect(timerValue).toBe('0D 23:59:55');

      jasmine.clock().tick(5000);
      await Vue.nextTick();
      expect(timerValue).toBe('0D 23:59:55');

      action = openmct.actions.getAction('timer.start');
      if (action) {
        action.invoke(timerObjectPath, timerView);
      }

      await Vue.nextTick();
      action = openmct.actions.getAction('timer.pause');
      if (action) {
        action.invoke(timerObjectPath, timerView);
      }

      await Vue.nextTick();
      timerValue = timerElement.querySelector('.c-timer__value').innerText;
      expect(timerValue).toBe('1D 00:00:00');
    });

    it('displays a stopped timer correctly in the DOM', async () => {
      const action = openmct.actions.getAction('timer.stop');
      if (action) {
        action.invoke(timerObjectPath, timerView);
      }

      await Vue.nextTick();
      const timerElement = element.querySelector('.c-timer');
      const timerValue = timerElement.querySelector('.c-timer__value').innerText;
      const timerResetButton = timerElement.querySelector('.c-timer__ctrl-reset');
      const timerPausePlayButton = timerElement.querySelector('.c-timer__ctrl-pause-play');

      expect(timerResetButton.classList.contains('hide')).toBe(true);
      expect(timerPausePlayButton.classList.contains('icon-play')).toBe(true);
      expect(timerValue).toBe('--:--:--');
    });

    it('displays a restarted timer correctly in the DOM', async () => {
      const action = openmct.actions.getAction('timer.restart');
      if (action) {
        action.invoke(timerObjectPath, timerView);
      }

      jasmine.clock().tick(5000);
      await Vue.nextTick();
      const timerElement = element.querySelector('.c-timer');
      const timerValue = timerElement.querySelector('.c-timer__value').innerText;
      const timerPausePlayButton = timerElement.querySelector('.c-timer__ctrl-pause-play');

      expect(timerPausePlayButton.classList.contains('icon-pause')).toBe(true);
      expect(timerValue).toBe('0D 00:00:05');
    });
  });
});
