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
import { createApp, defineComponent } from 'vue';

/**
 * @typedef {import('vue').Component} Component
 */

/**
 * Mounts a Vue component to a DOM element.
 * @param {Component | any} component
 * @param {Object} [options={}] the options object
 * @param {Object} [options.props] the props for the component
 * @param {Object} [options.children] the children for the component
 * @param {HTMLElement} [options.element] the element to mount the component to
 * @returns {Object}
 */
export default function mount(component, { props, children, element } = {}) {
  let el = element;
  if (!el) {
    el = document.createElement('div');
  }
  /** @type {Component | any} */
  let vueComponent = defineComponent(component);
  let app = createApp(vueComponent);
  let mountedComponentInstance = app.mount(el);

  // eslint-disable-next-line func-style
  const destroy = () => {
    app.unmount();
  };

  return {
    vNode: {
      componentInstance: mountedComponentInstance,
      el: mountedComponentInstance.$el
    },
    destroy,
    el
  };
}
