/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2023, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT is licensed under the Apache License, Version 2.0 (the
 * 'License'); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS, WITHOUT
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
import TabsLayout from './plugin';
import Vue from 'vue';
import EventEmitter from 'EventEmitter';

describe('the plugin', function () {
  let element;
  let child;
  let openmct;
  let tabsLayoutDefinition;
  const testViewObject = {
    identifier: {
      key: 'mock-tabs-object',
      namespace: ''
    },
    type: 'tabs',
    name: 'Tabs view',
    keep_alive: true,
    composition: [
      {
        identifier: {
          namespace: '',
          key: 'swg-1'
        }
      },
      {
        identifier: {
          namespace: '',
          key: 'swg-2'
        }
      }
    ]
  };
  const telemetryItemTemplate = {
    telemetry: {
      period: 5,
      amplitude: 5,
      offset: 5,
      dataRateInHz: 5,
      phase: 5,
      randomness: 0
    },
    type: 'generator',
    modified: 1592851063871,
    location: 'mine',
    persisted: 1592851063871
  };
  let telemetryItem1 = Object.assign({}, telemetryItemTemplate, {
    name: 'Sine Wave Generator 1',
    identifier: {
      namespace: '',
      key: 'swg-1'
    }
  });
  let telemetryItem2 = Object.assign({}, telemetryItemTemplate, {
    name: 'Sine Wave Generator 2',
    identifier: {
      namespace: '',
      key: 'swg-2'
    }
  });

  beforeEach((done) => {
    openmct = createOpenMct();
    openmct.install(new TabsLayout());
    tabsLayoutDefinition = openmct.types.get('tabs');

    element = document.createElement('div');
    child = document.createElement('div');
    child.style.display = 'block';
    child.style.width = '1920px';
    child.style.height = '1080px';
    element.appendChild(child);

    openmct.on('start', done);
    openmct.startHeadless();
  });

  afterEach(() => {
    return resetApplicationState(openmct);
  });

  it('defines a tabs object type with the correct key', () => {
    expect(tabsLayoutDefinition.definition.name).toEqual('Tabs View');
  });

  it('is creatable', () => {
    expect(tabsLayoutDefinition.definition.creatable).toEqual(true);
  });

  describe('the view', function () {
    let tabsLayoutViewProvider;
    let mockComposition;

    beforeEach(() => {
      mockComposition = new EventEmitter();
      mockComposition.load = () => {
        return Promise.resolve([telemetryItem1]);
      };

      spyOn(openmct.composition, 'get').and.returnValue(mockComposition);

      const applicableViews = openmct.objectViews.get(testViewObject, []);
      tabsLayoutViewProvider = applicableViews.find((viewProvider) => viewProvider.key === 'tabs');
      let view = tabsLayoutViewProvider.view(testViewObject, []);
      view.show(child, true);

      return Vue.nextTick();
    });

    it('provides a view', () => {
      expect(tabsLayoutViewProvider).toBeDefined();
    });

    it('renders tab element', () => {
      const tabsElements = element.querySelectorAll('.c-tabs');

      expect(tabsElements.length).toBe(1);
    });

    it('renders empty tab element with msg', () => {
      const tabsElement = element.querySelector('.c-tabs');

      expect(tabsElement.innerText.trim()).toEqual('Drag objects here to add them to this view.');
    });
  });

  describe('the view', function () {
    let tabsLayoutViewProvider;
    let mockComposition;
    let count = 0;

    beforeEach(() => {
      mockComposition = new EventEmitter();
      mockComposition.load = () => {
        if (count === 0) {
          mockComposition.emit('add', telemetryItem1);
          mockComposition.emit('add', telemetryItem2);
          count++;
        }

        return Promise.resolve([telemetryItem1, telemetryItem2]);
      };

      spyOn(openmct.composition, 'get').and.returnValue(mockComposition);

      const applicableViews = openmct.objectViews.get(testViewObject, []);
      tabsLayoutViewProvider = applicableViews.find((viewProvider) => viewProvider.key === 'tabs');
      let view = tabsLayoutViewProvider.view(testViewObject, []);
      view.show(child, true);

      return Vue.nextTick();
    });

    afterEach(() => {
      count = 0;
      testViewObject.keep_alive = true;
    });

    it('renders a tab for each item', () => {
      let tabEls = element.querySelectorAll('.js-tab');

      expect(tabEls.length).toEqual(2);
    });

    describe('with domainObject.keep_alive set to', () => {
      it('true, will keep all views loaded, regardless of current tab view', async () => {
        let tabEls = element.querySelectorAll('.js-tab');

        for (let i = 0; i < tabEls.length; i++) {
          const tab = tabEls[i];

          tab.click();
          await Vue.nextTick();

          const tabViewEls = element.querySelectorAll('.c-tabs-view__object');
          expect(tabViewEls.length).toEqual(2);
        }
      });

      it('false, will only keep the current tab view loaded', async () => {
        testViewObject.keep_alive = false;

        await Vue.nextTick();

        let tabViewEls = element.querySelectorAll('.c-tabs-view__object');

        expect(tabViewEls.length).toEqual(1);
      });
    });
  });
});
