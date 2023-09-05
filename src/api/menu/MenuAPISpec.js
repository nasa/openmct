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

import Vue from 'vue';

import { createMouseEvent, createOpenMct, resetApplicationState } from '../../utils/testing';
import Menu from './menu';
import MenuAPI from './MenuAPI';

describe('The Menu API', () => {
  let openmct;
  let appHolder;
  let menuAPI;
  let actionsArray;
  let result;
  let menuElement;

  const x = 8;
  const y = 16;

  const menuOptions = {
    onDestroy: () => {
      console.log('default onDestroy');
    }
  };

  beforeEach((done) => {
    appHolder = document.createElement('div');
    appHolder.style.display = 'block';
    appHolder.style.width = '1920px';
    appHolder.style.height = '1080px';

    openmct = createOpenMct();

    openmct.on('start', done);
    openmct.startHeadless();

    menuAPI = new MenuAPI(openmct);
    actionsArray = [
      {
        key: 'test-css-class-1',
        name: 'Test Action 1',
        cssClass: 'icon-clock',
        description: 'This is a test action 1',
        onItemClicked: () => {
          result = 'Test Action 1 Invoked';
        }
      },
      {
        key: 'test-css-class-2',
        name: 'Test Action 2',
        cssClass: 'icon-clock',
        description: 'This is a test action 2',
        onItemClicked: () => {
          result = 'Test Action 2 Invoked';
        }
      }
    ];
  });

  afterEach(() => {
    return resetApplicationState(openmct);
  });

  describe('showMenu method', () => {
    beforeAll(() => {
      spyOn(menuOptions, 'onDestroy').and.callThrough();
    });

    it('creates an instance of Menu when invoked', (done) => {
      menuOptions.onDestroy = done;

      menuAPI.showMenu(x, y, actionsArray, menuOptions);

      expect(menuAPI.menuComponent).toBeInstanceOf(Menu);
      document.body.click();
    });

    describe('creates a menu component', () => {
      it('with all the actions passed in', (done) => {
        menuOptions.onDestroy = done;

        menuAPI.showMenu(x, y, actionsArray, menuOptions);
        menuElement = document.querySelector('.c-menu');
        expect(menuElement).toBeDefined();

        const listItems = menuElement.children[0].children;

        expect(listItems.length).toEqual(actionsArray.length);
        document.body.click();
      });

      it('with click-able menu items, that will invoke the correct callBack', (done) => {
        menuOptions.onDestroy = done;

        menuAPI.showMenu(x, y, actionsArray, menuOptions);

        menuElement = document.querySelector('.c-menu');
        const listItem1 = menuElement.children[0].children[0];

        listItem1.click();

        expect(result).toEqual('Test Action 1 Invoked');
      });

      it('dismisses the menu when action is clicked on', (done) => {
        menuOptions.onDestroy = done;

        menuAPI.showMenu(x, y, actionsArray, menuOptions);

        menuElement = document.querySelector('.c-menu');
        const listItem1 = menuElement.children[0].children[0];
        listItem1.click();

        menuElement = document.querySelector('.c-menu');

        expect(menuElement).toBeNull();
      });

      it('invokes the destroy method when menu is dismissed', (done) => {
        menuOptions.onDestroy = done;

        spyOn(menuAPI, '_clearMenuComponent').and.callThrough();

        menuAPI.showMenu(x, y, actionsArray, menuOptions);

        document.body.click();

        expect(menuAPI._clearMenuComponent).toHaveBeenCalled();
      });

      it('invokes the onDestroy callback if passed in', (done) => {
        let count = 0;
        menuOptions.onDestroy = () => {
          count++;
          expect(count).toEqual(1);
          done();
        };

        menuAPI.showMenu(x, y, actionsArray, menuOptions);

        document.body.click();
      });
    });
  });

  describe('superMenu method', () => {
    it('creates a superMenu', (done) => {
      menuOptions.onDestroy = done;

      menuAPI.showSuperMenu(x, y, actionsArray, menuOptions);
      menuElement = document.querySelector('.c-super-menu__menu');

      expect(menuElement).not.toBeNull();
      document.body.click();
    });

    it('Mouse over a superMenu shows correct description', (done) => {
      menuOptions.onDestroy = done;

      menuAPI.showSuperMenu(x, y, actionsArray, menuOptions);
      menuElement = document.querySelector('.c-super-menu__menu');

      const superMenuItem = menuElement.querySelector('li');
      const mouseOverEvent = createMouseEvent('mouseover');

      superMenuItem.dispatchEvent(mouseOverEvent);
      const itemDescription = document.querySelector('.l-item-description__description');

      Vue.nextTick(() => {
        expect(menuElement).not.toBeNull();
        expect(itemDescription.innerText).toEqual(actionsArray[0].description);

        document.body.click();
      });
    });
  });

  describe('Menu Placements', () => {
    it('default menu position BOTTOM_RIGHT', (done) => {
      menuOptions.onDestroy = done;

      menuAPI.showMenu(x, y, actionsArray, menuOptions);
      menuElement = document.querySelector('.c-menu');

      const boundingClientRect = menuElement.getBoundingClientRect();
      const left = boundingClientRect.left;
      const top = boundingClientRect.top;

      expect(left).toEqual(x);
      expect(top).toEqual(y);

      document.body.click();
    });

    it('menu position BOTTOM_RIGHT', (done) => {
      menuOptions.onDestroy = done;
      menuOptions.placement = openmct.menus.menuPlacement.BOTTOM_RIGHT;

      menuAPI.showMenu(x, y, actionsArray, menuOptions);
      menuElement = document.querySelector('.c-menu');

      const boundingClientRect = menuElement.getBoundingClientRect();
      const left = boundingClientRect.left;
      const top = boundingClientRect.top;

      expect(left).toEqual(x);
      expect(top).toEqual(y);

      document.body.click();
    });
  });
});
