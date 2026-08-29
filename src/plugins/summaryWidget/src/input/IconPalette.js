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
import Palette from './Palette.js';

//The icons that will be used to instantiate this palette if none are provided
const DEFAULT_ICONS = [
  'icon-alert-rect',
  'icon-alert-triangle',
  'icon-arrow-down',
  'icon-arrow-left',
  'icon-arrow-right',
  'icon-arrow-double-up',
  'icon-arrow-tall-up',
  'icon-arrow-tall-down',
  'icon-arrow-double-down',
  'icon-arrow-up',
  'icon-asterisk',
  'icon-bell',
  'icon-check',
  'icon-eye-open',
  'icon-gear',
  'icon-hourglass',
  'icon-info',
  'icon-link',
  'icon-lock',
  'icon-people',
  'icon-person',
  'icon-plus',
  'icon-trash',
  'icon-x'
];

/**
 * Instantiates a new Open MCT Icon Palette input
 * @constructor
 * @param {string} cssClass The class name of the icon which should be applied
 *                          to this palette
 * @param {Element} container The view that contains this palette
 * @param {string[]} icons (optional) A list of icons that should be used to instantiate this palette
 */
export default function IconPalette(cssClass, container, icons) {
  this.icons = icons || DEFAULT_ICONS;
  this.palette = new Palette(cssClass, container, this.icons);

  this.palette.setNullOption('');
  this.oldIcon = this.palette.current || '';

  const domElement = this.palette.getDOM();
  const self = this;

  domElement.querySelector('.c-button--menu').classList.add('c-button--swatched');
  domElement.querySelector('.t-swatch').classList.add('icon-swatch');
  domElement.querySelector('.c-palette').classList.add('c-palette--icon');

  domElement.querySelectorAll('.c-palette-item').forEach((item) => {
    item.classList.add(item.dataset.item);
  });

  /**
   * Update this palette's current selection indicator with the style
   * of the currently selected item
   * @private
   */
  function updateSwatch() {
    if (self.oldIcon) {
      domElement.querySelector('.icon-swatch').classList.remove(self.oldIcon);
    }

    domElement.querySelector('.icon-swatch').classList.add(self.palette.getCurrent());
    self.oldIcon = self.palette.getCurrent();
  }

  this.palette.on('change', updateSwatch);

  return this.palette;
}
