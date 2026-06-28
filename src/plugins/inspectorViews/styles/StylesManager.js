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
import { EventEmitter } from 'eventemitter3';

const LOCAL_STORAGE_KEY = 'mct-saved-styles';
const LIMIT = 20;

/**
 * @typedef {Object} Style
 * @property {*} property
 */
class StylesManager extends EventEmitter {
  load() {
    let styles = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    styles = styles ? JSON.parse(styles) : [];

    return styles;
  }

  save(style) {
    const normalizedStyle = this.normalizeStyle(style);
    const styles = this.load();

    if (!this.isSaveLimitReached(styles)) {
      styles.unshift(normalizedStyle);

      if (this.persist(styles)) {
        this.emit('stylesUpdated', styles);
      }
    }
  }

  delete(index) {
    const styles = this.load();
    styles.splice(index, 1);

    if (this.persist(styles)) {
      this.emit('stylesUpdated', styles);
    }
  }

  select(style) {
    this.emit('styleSelected', style);
  }

  /**
   * @private
   */
  normalizeStyle(style) {
    const normalizedStyle = this.getBaseStyleObject();

    Object.keys(normalizedStyle).forEach((property) => {
      const value = style[property];
      if (value !== undefined) {
        normalizedStyle[property] = value;
      }
    });

    return normalizedStyle;
  }

  /**
   * @private
   */
  getBaseStyleObject() {
    return {
      backgroundColor: '',
      border: '',
      color: '',
      fontSize: 'default',
      font: 'default'
    };
  }

  /**
   * @private
   */
  isSaveLimitReached(styles) {
    if (styles.length >= LIMIT) {
      this.emit('limitReached');

      return true;
    }

    return false;
  }

  /**
   * @private
   */
  isExistingStyle(style, styles) {
    return styles.some((existingStyle) => this.isEqual(style, existingStyle));
  }

  /**
   * @private
   */
  persist(styles) {
    try {
      window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(styles));

      return true;
    } catch (e) {
      this.emit('persistError');
    }

    return false;
  }

  /**
   * @private
   */
  isEqual(style1, style2) {
    const keys = Object.keys(Object.assign({}, style1, style2));
    const different = keys.some(
      (key) =>
        (!style1[key] && style2[key]) ||
        (style1[key] && !style2[key]) ||
        style1[key] !== style2[key]
    );

    return !different;
  }
}

const stylesManager = new StylesManager();
// breaks on adding listener later
// Object.freeze(stylesManager);

export default stylesManager;
