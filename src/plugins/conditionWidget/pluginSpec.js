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
import { nextTick } from 'vue';

import ConditionWidgetPlugin from './plugin.js';

describe('the plugin', function () {
  const CONDITION_WIDGET_KEY = 'conditionWidget';
  let objectDef;
  let element;
  let child;
  let openmct;
  let mockConditionObjectDefinition;
  let mockConditionObject;
  let mockConditionObjectPath;

  beforeEach((done) => {
    mockConditionObjectPath = [
      {
        name: 'mock folder',
        type: 'fake-folder',
        identifier: {
          key: 'mock-folder',
          namespace: ''
        }
      },
      {
        name: 'mock parent folder',
        type: 'conditionWidget',
        identifier: {
          key: 'mock-parent-folder',
          namespace: ''
        }
      }
    ];

    mockConditionObjectDefinition = {
      name: 'Condition Widget',
      key: 'conditionWidget',
      creatable: true
    };

    mockConditionObject = {
      conditionWidget: {
        identifier: {
          namespace: '',
          key: 'condition-widget-object'
        },
        url: 'https://nasa.github.io/openmct/',
        label: 'Foo Widget',
        type: 'conditionWidget',
        composition: []
      },
      telemetry: {
        identifier: {
          namespace: '',
          key: 'telemetry-object'
        },
        type: 'test-telemetry-object',
        name: 'Test Telemetry Object',
        telemetry: {
          values: [
            {
              key: 'name',
              name: 'Name',
              format: 'string'
            },
            {
              key: 'utc',
              name: 'Time',
              format: 'utc',
              hints: {
                domain: 1
              }
            },
            {
              name: 'Some attribute 1',
              key: 'some-key-1',
              hints: {
                range: 1
              }
            },
            {
              name: 'Some attribute 2',
              key: 'some-key-2'
            }
          ]
        }
      }
    };

    const timeSystem = {
      timeSystemKey: 'utc',
      bounds: {
        start: 1597160002854,
        end: 1597181232854
      }
    };

    openmct = createOpenMct(timeSystem);
    openmct.install(new ConditionWidgetPlugin());

    objectDef = openmct.types.get('conditionWidget').definition;

    element = document.createElement('div');
    element.style.width = '640px';
    element.style.height = '480px';
    child = document.createElement('div');
    child.style.width = '640px';
    child.style.height = '480px';
    element.appendChild(child);

    openmct.on('start', done);
    openmct.startHeadless();
  });

  afterEach(() => {
    return resetApplicationState(openmct);
  });

  it('defines a conditionWidget object type with the correct key', () => {
    expect(objectDef.key).toEqual(mockConditionObjectDefinition.key);
  });

  describe('the conditionWidget object', () => {
    it('is creatable', () => {
      expect(objectDef.creatable).toEqual(mockConditionObjectDefinition.creatable);
    });
  });

  describe('the view', () => {
    let conditionWidgetView;
    let testViewObject;

    beforeEach(() => {
      testViewObject = {
        id: 'test-object',
        identifier: {
          key: 'test-object',
          namespace: ''
        },
        type: 'conditionWidget'
      };

      const applicableViews = openmct.objectViews.get(testViewObject, mockConditionObjectPath);
      conditionWidgetView = applicableViews.find(
        (viewProvider) => viewProvider.key === 'conditionWidget'
      );
      let view = conditionWidgetView.view(testViewObject, element);
      view.show(child, true);

      return nextTick();
    });

    it('provides a view', () => {
      expect(conditionWidgetView).toBeDefined();
    });
  });

  it('should have a view provider for condition widget objects', () => {
    const applicableViews = openmct.objectViews.get(mockConditionObject[CONDITION_WIDGET_KEY], []);

    const conditionWidgetViewProvider = applicableViews.find(
      (viewProvider) => viewProvider.key === CONDITION_WIDGET_KEY
    );

    expect(applicableViews.length).toEqual(1);
    expect(conditionWidgetViewProvider).toBeDefined();
  });

  it('should render a view with a URL and label', async () => {
    const urlParent = document.createElement('div');
    const urlChild = document.createElement('div');
    urlParent.appendChild(urlChild);

    const applicableViews = openmct.objectViews.get(mockConditionObject[CONDITION_WIDGET_KEY], []);

    const conditionWidgetViewProvider = applicableViews.find(
      (viewProvider) => viewProvider.key === CONDITION_WIDGET_KEY
    );

    const conditionWidgetView = conditionWidgetViewProvider.view(
      mockConditionObject[CONDITION_WIDGET_KEY],
      [mockConditionObject[CONDITION_WIDGET_KEY]]
    );
    conditionWidgetView.show(urlChild);

    await nextTick();

    const domainUrl = mockConditionObject[CONDITION_WIDGET_KEY].url;
    expect(urlParent.innerHTML).toContain(
      `<a class="c-condition-widget__label-wrapper" href="${domainUrl}"`
    );

    const conditionWidgetRender = urlParent.querySelector('.c-condition-widget');
    expect(conditionWidgetRender).toBeDefined();
    expect(conditionWidgetRender.innerHTML).toContain('<div class="c-condition-widget__label">');

    const conditionWidgetLabel = conditionWidgetRender.querySelector('.c-condition-widget__label');
    expect(conditionWidgetLabel).toBeDefined();
    const domainLabel = mockConditionObject[CONDITION_WIDGET_KEY].label;
    expect(conditionWidgetLabel.textContent).toContain(domainLabel);
  });
});
