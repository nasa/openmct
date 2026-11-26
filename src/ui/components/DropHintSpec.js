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
import mount from 'utils/mount';
import { nextTick } from 'vue';

import DropHint from './DropHint.vue';

describe('DropHint', () => {
  let destroy;
  let parentElement;
  let allowDrop;
  let onDrop;

  function mountDropHint({ label = 'Drop here to add', allowDropFn, onDropFn } = {}) {
    allowDrop = allowDropFn || jasmine.createSpy('allowDrop').and.returnValue(true);
    onDrop = onDropFn || jasmine.createSpy('onDrop');
    parentElement = document.createElement('div');
    document.body.appendChild(parentElement);

    const result = mount(
      {
        components: {
          DropHint
        },
        data() {
          return {
            label
          };
        },
        methods: {
          allowDrop,
          onDrop
        },
        template: `<DropHint
          :index="0"
          :allow-drop="allowDrop"
          :label="label"
          @object-drop-to="onDrop"
        />`
      },
      {
        element: parentElement
      }
    );

    destroy = result.destroy;

    return result.vNode.componentInstance;
  }

  afterEach(() => {
    if (destroy) {
      destroy();
      destroy = undefined;
    }

    if (parentElement?.parentNode) {
      parentElement.parentNode.removeChild(parentElement);
    }

    parentElement = undefined;
  });

  function dispatchDragStart(types = ['openmct/composable-domain-object']) {
    const event = new Event('dragstart', { bubbles: true });
    Object.defineProperty(event, 'dataTransfer', {
      value: {
        types,
        getData: () => '',
        setData: () => {}
      }
    });
    document.dispatchEvent(event);

    return event;
  }

  it('is hidden until a valid drag starts', () => {
    mountDropHint();

    const dropHint = parentElement.querySelector('.c-drop-hint');
    expect(dropHint).not.toBeNull();
    expect(dropHint.offsetParent).toBeNull();
  });

  it('shows an accessible drop region when allowDrop returns true', async () => {
    mountDropHint({
      label: 'Drop telemetry here'
    });

    dispatchDragStart();
    await nextTick();

    const dropHint = parentElement.querySelector('.c-drop-hint');
    expect(dropHint.offsetParent).not.toBeNull();
    expect(dropHint.getAttribute('role')).toBe('region');
    expect(dropHint.getAttribute('aria-label')).toBe('Drop telemetry here');
  });

  it('stays hidden when allowDrop returns false', async () => {
    mountDropHint({
      allowDropFn: jasmine.createSpy('allowDrop').and.returnValue(false)
    });

    dispatchDragStart(['openmct/domain-object-path']);
    await nextTick();

    const dropHint = parentElement.querySelector('.c-drop-hint');
    expect(allowDrop).toHaveBeenCalled();
    expect(dropHint.offsetParent).toBeNull();
  });

  it('emits object-drop-to and hides after a drop', async () => {
    mountDropHint();

    dispatchDragStart();
    await nextTick();

    const dropHint = parentElement.querySelector('.c-drop-hint');
    dropHint.dispatchEvent(new Event('drop', { bubbles: true }));
    await nextTick();

    expect(onDrop).toHaveBeenCalled();
    expect(dropHint.offsetParent).toBeNull();
  });

  it('hides when drag ends without a drop', async () => {
    mountDropHint();

    dispatchDragStart();
    await nextTick();

    document.dispatchEvent(new Event('dragend'));
    await nextTick();

    const dropHint = parentElement.querySelector('.c-drop-hint');
    expect(dropHint.offsetParent).toBeNull();
  });
});
