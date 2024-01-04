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
import mount from 'utils/mount';
import { h } from 'vue';

import MenuComponent from './components/MenuComponent.vue';
import SuperMenuComponent from './components/SuperMenu.vue';

const MENU_PLACEMENT = {
  TOP: 'top',
  TOP_LEFT: 'top-left',
  TOP_RIGHT: 'top-right',
  BOTTOM: 'bottom',
  BOTTOM_LEFT: 'bottom-left',
  BOTTOM_RIGHT: 'bottom-right',
  LEFT: 'left',
  RIGHT: 'right'
};

/**
 * Represents a Menu that extends EventEmitter functionality.
 * This class provides methods to show and dismiss menus, and manages their lifecycle.
 */
class Menu extends EventEmitter {
  /**
   * Creates a Menu instance.
   * @param {Object} options - Configuration options for the menu.
   * @param {Function} [options.onDestroy] - Callback function for the 'destroy' event.
   */
  constructor(options) {
    super();

    this.options = options;
    if (options.onDestroy) {
      this.once('destroy', options.onDestroy);
    }

    // Binding methods to ensure the correct 'this' context
    this.dismiss = this.dismiss.bind(this);
    this.show = this.show.bind(this);
    this.showMenu = this.showMenu.bind(this);
    this.showSuperMenu = this.showSuperMenu.bind(this);
  }

  /**
   * Dismisses the menu and removes the associated event listener.
   * Emits a 'destroy' event on dismissal.
   */
  dismiss() {
    if (this.destroy) {
      this.destroy();
      this.destroy = null;
    }
    document.removeEventListener('click', this.dismiss);
    this.emit('destroy');
  }

  /**
   * Shows a menu using the MenuComponent.
   * Renders the menu and sets up necessary destruction logic.
   */
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
      }
    });

    this.el = vNode.el;
    this.destroy = destroy;

    this.show();
  }

  /**
   * Shows a super menu using the SuperMenuComponent.
   * Renders the super menu and sets up necessary destruction logic.
   */
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
      }
    });

    this.el = vNode.el;
    this.destroy = destroy;

    this.show();
  }

  /**
   * Appends the menu element to the document body and adds an event listener for dismissal.
   */
  show() {
    document.body.appendChild(this.el);
    document.addEventListener('click', this.dismiss);
  }
}

export { Menu, MENU_PLACEMENT };
