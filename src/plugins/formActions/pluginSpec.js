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
import { debounce } from 'lodash';
import { createMouseEvent, createOpenMct, resetApplicationState } from 'utils/testing';
import Vue from 'vue';

describe('EditPropertiesAction plugin', () => {
  let editPropertiesAction;
  let openmct;
  let element;

  beforeEach((done) => {
    element = document.createElement('div');
    element.style.display = 'block';
    element.style.width = '1920px';
    element.style.height = '1080px';

    openmct = createOpenMct();
    openmct.on('start', done);
    openmct.startHeadless(element);

    editPropertiesAction = openmct.actions.getAction('properties');
  });

  afterEach(() => {
    editPropertiesAction = null;

    return resetApplicationState(openmct);
  });

  it('editPropertiesAction exists', () => {
    expect(editPropertiesAction.key).toEqual('properties');
  });

  it('edit properties action applies to only persistable objects', () => {
    spyOn(openmct.objects, 'isPersistable').and.returnValue(true);

    const domainObject = {
      name: 'mock folder',
      type: 'folder',
      identifier: {
        key: 'mock-folder',
        namespace: ''
      },
      composition: []
    };
    const isApplicableTo = editPropertiesAction.appliesTo([domainObject]);
    expect(isApplicableTo).toBe(true);
  });

  it('edit properties action does not apply to non persistable objects', () => {
    spyOn(openmct.objects, 'isPersistable').and.returnValue(false);

    const domainObject = {
      name: 'mock folder',
      type: 'folder',
      identifier: {
        key: 'mock-folder',
        namespace: ''
      },
      composition: []
    };
    const isApplicableTo = editPropertiesAction.appliesTo([domainObject]);
    expect(isApplicableTo).toBe(false);
  });

  it('edit properties action when invoked shows form', (done) => {
    const domainObject = {
      name: 'mock folder',
      notes: 'mock notes',
      type: 'folder',
      identifier: {
        key: 'mock-folder',
        namespace: ''
      },
      modified: 1643065068597,
      persisted: 1643065068600,
      composition: []
    };

    editPropertiesAction
      .invoke([domainObject])
      .then(() => {
        done();
      })
      .catch(() => {
        done();
      });

    Vue.nextTick(() => {
      const form = document.querySelector('.js-form');
      const title = form.querySelector('input');
      expect(title.value).toEqual(domainObject.name);

      const notes = form.querySelector('textArea');
      expect(notes.value).toEqual(domainObject.notes);

      const buttons = form.querySelectorAll('button');
      expect(buttons[0].textContent.trim()).toEqual('OK');
      expect(buttons[1].textContent.trim()).toEqual('Cancel');

      const clickEvent = createMouseEvent('click');
      buttons[1].dispatchEvent(clickEvent);
    });
  });

  it('edit properties action saves changes', (done) => {
    const oldName = 'mock folder';
    const newName = 'renamed mock folder';
    const domainObject = {
      name: oldName,
      notes: 'mock notes',
      type: 'folder',
      identifier: {
        key: 'mock-folder',
        namespace: ''
      },
      modified: 1643065068597,
      persisted: 1643065068600,
      composition: []
    };
    let unObserve;

    function callback(newObject) {
      expect(newObject.name).not.toEqual(oldName);
      expect(newObject.name).toEqual(newName);

      unObserve();
      done();
    }

    const deBouncedCallback = debounce(callback, 300);
    unObserve = openmct.objects.observe(domainObject, '*', deBouncedCallback);

    editPropertiesAction.invoke([domainObject]);

    Vue.nextTick(() => {
      const form = document.querySelector('.js-form');
      const title = form.querySelector('input');
      const notes = form.querySelector('textArea');

      const buttons = form.querySelectorAll('button');
      expect(buttons[0].textContent.trim()).toEqual('OK');
      expect(buttons[1].textContent.trim()).toEqual('Cancel');

      expect(title.value).toEqual(domainObject.name);
      expect(notes.value).toEqual(domainObject.notes);

      // change input field value and dispatch event for it
      title.focus();
      title.value = newName;
      title.dispatchEvent(new Event('input'));
      title.blur();

      const clickEvent = createMouseEvent('click');
      buttons[0].dispatchEvent(clickEvent);
    });
  });

  it('edit properties action discards changes', (done) => {
    const name = 'mock folder';
    const domainObject = {
      name,
      notes: 'mock notes',
      type: 'folder',
      identifier: {
        key: 'mock-folder',
        namespace: ''
      },
      modified: 1643065068597,
      persisted: 1643065068600,
      composition: []
    };

    editPropertiesAction
      .invoke([domainObject])
      .then(() => {
        expect(domainObject.name).toEqual(name);
        done();
      })
      .catch(() => {
        expect(domainObject.name).toEqual(name);
        done();
      });

    const form = document.querySelector('.js-form');
    const buttons = form.querySelectorAll('button');
    const clickEvent = createMouseEvent('click');
    buttons[1].dispatchEvent(clickEvent);
  });
});
