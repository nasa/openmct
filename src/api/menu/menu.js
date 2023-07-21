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
import EventEmitter from 'EventEmitter';
import MenuComponent from './components/Menu.vue';
import SuperMenuComponent from './components/SuperMenu.vue';
import { h } from 'vue';
import mount from 'utils/mount';

export const MENU_PLACEMENT = {
  TOP: 'top',
  TOP_LEFT: 'top-left',
  TOP_RIGHT: 'top-right',
  BOTTOM: 'bottom',
  BOTTOM_LEFT: 'bottom-left',
  BOTTOM_RIGHT: 'bottom-right',
  LEFT: 'left',
  RIGHT: 'right'
};

class Menu extends EventEmitter {
  constructor(options) {
    super();

    this.options = options;
    if (options.onDestroy) {
      this.once('destroy', options.onDestroy);
    }

    this.dismiss = this.dismiss.bind(this);
    this.show = this.show.bind(this);
    this.showMenu = this.showMenu.bind(this);
    this.showSuperMenu = this.showSuperMenu.bind(this);
  }

  dismiss() {
    this.emit('destroy');
    if (this.destroy) {
      this.destroy();
      this.destroy = null;
    }
    document.removeEventListener('click', this.dismiss);
  }

  showMenu() {
    if (this.destroy) {
      return;
    }
    const { vNode, destroy } = mount({
      render() {
        return h(MenuComponent);
      },
      provide: {
        options: this.options
      },
      // TODO: Remove this exception upon full migration to Vue 3
      // https://v3-migration.vuejs.org/breaking-changes/render-function-api.html#render-function-argument
      compatConfig: {
        RENDER_FUNCTION: false
      }
    });

    this.el = vNode.el;
    this.destroy = destroy;

    this.show();
  }

  showSuperMenu() {
    const { vNode, destroy } = mount({
      data() {
        return {
          top: '0px',
          left: '0px'
        };
      },
      render() {
        return h(SuperMenuComponent);
      },
      provide: {
        options: this.options
      },
      // TODO: Remove this exception upon full migration to Vue 3
      // https://v3-migration.vuejs.org/breaking-changes/render-function-api.html#render-function-argument
      compatConfig: {
        RENDER_FUNCTION: false
      }
    });

    this.el = vNode.el;
    this.destroy = destroy;

    this.show();
  }

  show() {
    document.body.appendChild(this.el);
    document.addEventListener('click', this.dismiss);
  }
}

export default Menu;
