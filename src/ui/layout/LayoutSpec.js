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
import { render } from '@testing-library/vue';
import Layout from './Layout.vue';
import Vue from 'vue';

fdescribe('Open MCT Layout:', () => {
  let openmct;
  let container;

  beforeEach((done) => {
    openmct = createOpenMct();
    openmct.on('start', done);

    // to silence error from BrowseBar.vue
    spyOn(openmct.objectViews, 'get').and.callFake(() => []);

    openmct.startHeadless();
  });

  afterEach(() => {
    return resetApplicationState(openmct);
  });

  describe('the pane:', () => {
    const components = {
      tree: {
        param: 'hideTree',
        pane: '.l-shell__pane-tree',
        collapseButton: '.l-shell__pane-tree .l-pane__collapse-button',
        expandButton: '.l-shell__pane-tree .l-pane__expand-button'
      },
      inspector: {
        param: 'hideInspector',
        pane: '.l-shell__pane-inspector',
        collapseButton: '.l-shell__pane-inspector .l-pane__collapse-button',
        expandButton: '.l-shell__pane-inspector .l-pane__expand-button'
      }
    };

    // eslint-disable-next-line require-await
    async function createLayout() {
      const result = render(Layout, {
        provide: {
          openmct
        }
      });
      container = result.container;
    }

    function isCollapsed(selector) {
      return container.querySelector(selector).classList.contains('l-pane--collapsed');
    }

    function setHideParams() {
      Object.entries(components).forEach(([name, component]) => {
        openmct.router.setSearchParam(component.param, true);
      });
    }

    function toggleCollapseButtons() {
      Object.entries(components).forEach(([name, component]) => {
        container.querySelector(component.collapseButton).click();
      });
    }

    function toggleExpandButtons() {
      Object.entries(components).forEach(([name, component]) => {
        container.querySelector(component.expandButton).click();
      });
    }

    it('is displayed on layout load', async () => {
      await createLayout();
      await Vue.nextTick();

      Object.entries(components).forEach(([name, component]) => {
        expect(container.querySelector(component.pane)).toBeTruthy();
        expect(isCollapsed(component.pane)).toBeFalse();
      });
    });

    it('is collapsed on layout load if specified by a hide param', async () => {
      setHideParams();

      await createLayout();
      await Vue.nextTick();

      Object.entries(components).forEach(([name, component]) => {
        expect(isCollapsed(component.pane)).toBeTrue();
      });
    });

    it('on toggle collapses if expanded', async () => {
      await createLayout();
      toggleCollapseButtons();
      await Vue.nextTick();

      Object.entries(components).forEach(([name, component]) => {
        expect(openmct.router.getSearchParam(component.param)).toEqual('true');
        expect(isCollapsed(component.pane)).toBeTrue();
      });
    });

    it('on toggle expands if collapsed', async () => {
      setHideParams();

      await createLayout();
      toggleExpandButtons();
      await Vue.nextTick();

      Object.entries(components).forEach(([name, component]) => {
        expect(openmct.router.getSearchParam(component.param)).not.toEqual('true');
        expect(isCollapsed(component.pane)).toBeFalse();
      });
    });
  });
});
