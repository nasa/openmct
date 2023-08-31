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

import EventEmitter from 'eventemitter3';
import eventHelpers from '../lib/eventHelpers';
import _ from 'lodash';

/**
 * @template {object} T
 * @template {object} O
 */
export default class Model extends EventEmitter {
  /**
   * @param {ModelOptions<T, O>} options
   */
  constructor(options) {
    super();
    Object.defineProperty(this, '_events', {
      value: this._events,
      enumerable: false,
      configurable: false,
      writable: true
    });

    //need to do this as we're already extending EventEmitter
    eventHelpers.extend(this);

    if (!options) {
      options = {};
    }

    // FIXME: this.id is defined as a method further below, but here it is
    // assigned a possibly-undefined value. Is this code unused?
    this.id = options.id;

    /** @type {ModelType<T>} */
    this.model = options.model;
    this.collection = options.collection;
    const defaults = this.defaultModel(options);
    if (!this.model) {
      this.model = options.model = defaults;
    } else {
      _.defaultsDeep(this.model, defaults);
    }

    this.initialize(options);

    /** @type {keyof ModelType<T> } */
    this.idAttr = 'id';
  }

  /**
   * @param {ModelOptions<T, O>} options
   * @returns {ModelType<T>}
   */
  defaultModel(options) {
    return {};
  }

  /**
   * @abstract
   * @param {ModelOptions<T, O>} options
   */
  initialize(options) {}

  /**
   * Destroy the model, removing all listeners and subscriptions.
   */
  destroy() {
    this.emit('destroy');
    this.removeAllListeners();
  }

  id() {
    return this.get(this.idAttr);
  }

  /**
   * @template {keyof ModelType<T>} K
   * @param {K} attribute
   * @returns {ModelType<T>[K]}
   */
  get(attribute) {
    return this.model[attribute];
  }

  /**
   * @template {keyof ModelType<T>} K
   * @param {K} attribute
   * @returns boolean
   */
  has(attribute) {
    return _.has(this.model, attribute);
  }

  /**
   * @template {keyof ModelType<T>} K
   * @param {K} attribute
   * @param {ModelType<T>[K]} value
   */
  set(attribute, value) {
    const oldValue = this.model[attribute];
    this.model[attribute] = value;
    this.emit('change', attribute, value, oldValue, this);
    this.emit('change:' + attribute, value, oldValue, this);
  }

  /**
   * @template {keyof ModelType<T>} K
   * @param {K} attribute
   */
  unset(attribute) {
    const oldValue = this.model[attribute];
    delete this.model[attribute];
    this.emit('change', attribute, undefined, oldValue, this);
    this.emit('change:' + attribute, undefined, oldValue, this);
  }
}

/** @typedef {any} TODO */

/** @typedef {TODO} OpenMCT */

/**
@template {object} T
@typedef {{
    id?: string
} & T} ModelType
*/

/**
@template {object} T
@template {object} O
@typedef {{
    model?: ModelType<T>
    models?: T[]
    openmct: OpenMCT
    id?: string
    [k: string]: unknown
} & O} ModelOptions
*/
