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

import { createOpenMct, resetApplicationState } from 'utils/testing';
import clockPlugin from './plugin';

import Vue from 'vue';

describe('Clock plugin:', () => {
  let openmct;
  let clockDefinition;
  let element;
  let child;
  let appHolder;

  let clockDomainObject;

  function setupClock(enableClockIndicator) {
    return new Promise((resolve, reject) => {
      clockDomainObject = {
        identifier: {
          key: 'clock',
          namespace: 'test-namespace'
        },
        type: 'clock'
      };

      appHolder = document.createElement('div');
      appHolder.style.width = '640px';
      appHolder.style.height = '480px';
      document.body.appendChild(appHolder);

      openmct = createOpenMct();

      element = document.createElement('div');
      child = document.createElement('div');
      element.appendChild(child);

      openmct.install(clockPlugin({ enableClockIndicator }));

      clockDefinition = openmct.types.get('clock').definition;
      clockDefinition.initialize(clockDomainObject);

      openmct.on('start', resolve);
      openmct.start(appHolder);
    });
  }

  describe('Clock view:', () => {
    let clockViewProvider;
    let clockView;
    let clockViewObject;
    let mutableClockObject;

    beforeEach(async () => {
      await setupClock(true);

      clockViewObject = {
        ...clockDomainObject,
        id: 'test-object',
        name: 'Clock',
        configuration: {
          baseFormat: 'YYYY/MM/DD hh:mm:ss',
          use24: 'clock12',
          timezone: 'UTC'
        }
      };

      spyOn(openmct.objects, 'get').and.returnValue(Promise.resolve(clockViewObject));
      spyOn(openmct.objects, 'save').and.returnValue(Promise.resolve(true));
      spyOn(openmct.objects, 'supportsMutation').and.returnValue(true);

      const applicableViews = openmct.objectViews.get(clockViewObject, [clockViewObject]);
      clockViewProvider = applicableViews.find((viewProvider) => viewProvider.key === 'clock.view');

      mutableClockObject = await openmct.objects.getMutable(clockViewObject.identifier);

      clockView = clockViewProvider.view(mutableClockObject);
      clockView.show(child);

      await Vue.nextTick();
      await new Promise((resolve) => requestAnimationFrame(resolve));
    });

    afterEach(() => {
      clockView.destroy();
      openmct.objects.destroyMutable(mutableClockObject);
      if (appHolder) {
        appHolder.remove();
      }

      return resetApplicationState(openmct);
    });

    it('has name as Clock', () => {
      expect(clockDefinition.name).toEqual('Clock');
    });

    it('is creatable', () => {
      expect(clockDefinition.creatable).toEqual(true);
    });

    it('provides clock view', () => {
      expect(clockViewProvider).toBeDefined();
    });

    it('renders clock element', () => {
      const clockElement = element.querySelectorAll('.c-clock');
      expect(clockElement.length).toBe(1);
    });

    it('renders major elements', () => {
      const clockElement = element.querySelector('.c-clock');
      const timezone = clockElement.querySelector('.c-clock__timezone');
      const time = clockElement.querySelector('.c-clock__value');
      const amPm = clockElement.querySelector('.c-clock__ampm');
      const hasMajorElements = Boolean(timezone && time && amPm);

      expect(hasMajorElements).toBe(true);
    });

    it('renders time in UTC', () => {
      const clockElement = element.querySelector('.c-clock');
      const timezone = clockElement.querySelector('.c-clock__timezone').textContent.trim();

      expect(timezone).toBe('UTC');
    });

    it('updates the 24 hour option in the configuration', (done) => {
      expect(clockDomainObject.configuration.use24).toBe('clock12');
      const new24Option = 'clock24';

      openmct.objects.observe(clockViewObject, 'configuration', (changedDomainObject) => {
        expect(changedDomainObject.use24).toBe(new24Option);
        done();
      });

      openmct.objects.mutate(clockViewObject, 'configuration.use24', new24Option);
    });

    it('updates the timezone option in the configuration', (done) => {
      expect(clockDomainObject.configuration.timezone).toBe('UTC');
      const newZone = 'CST6CDT';

      openmct.objects.observe(clockViewObject, 'configuration', (changedDomainObject) => {
        expect(changedDomainObject.timezone).toBe(newZone);
        done();
      });

      openmct.objects.mutate(clockViewObject, 'configuration.timezone', newZone);
    });

    it('updates the time format option in the configuration', (done) => {
      expect(clockDomainObject.configuration.baseFormat).toBe('YYYY/MM/DD hh:mm:ss');
      const newFormat = 'hh:mm:ss';

      openmct.objects.observe(clockViewObject, 'configuration', (changedDomainObject) => {
        expect(changedDomainObject.baseFormat).toBe(newFormat);
        done();
      });

      openmct.objects.mutate(clockViewObject, 'configuration.baseFormat', newFormat);
    });
  });

  describe('Clock Indicator view:', () => {
    let clockIndicator;

    afterEach(() => {
      if (clockIndicator) {
        clockIndicator.remove();
      }

      clockIndicator = undefined;
      if (appHolder) {
        appHolder.remove();
      }

      return resetApplicationState(openmct);
    });

    it("doesn't exist", async () => {
      await setupClock(false);

      clockIndicator = openmct.indicators.indicatorObjects.find(
        (indicator) => indicator.key === 'clock-indicator'
      );

      const clockIndicatorMissing = clockIndicator === null || clockIndicator === undefined;
      expect(clockIndicatorMissing).toBe(true);
    });

    it('exists', async () => {
      await setupClock(true);

      clockIndicator = openmct.indicators.indicatorObjects.find(
        (indicator) => indicator.key === 'clock-indicator'
      ).element;

      const hasClockIndicator = clockIndicator !== null && clockIndicator !== undefined;
      expect(hasClockIndicator).toBe(true);
    });

    it('contains text', async () => {
      await setupClock(true);

      await Vue.nextTick();
      await new Promise((resolve) => requestAnimationFrame(resolve));

      clockIndicator = openmct.indicators.indicatorObjects.find(
        (indicator) => indicator.key === 'clock-indicator'
      ).element;
      const clockIndicatorText = clockIndicator.textContent.trim();
      const textIncludesUTC = clockIndicatorText.includes('UTC');

      expect(textIncludesUTC).toBe(true);
    });
  });
});
