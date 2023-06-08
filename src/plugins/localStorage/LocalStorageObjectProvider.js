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

export default class LocalStorageObjectProvider {
  constructor(spaceKey = 'mct') {
    this.localStorage = window.localStorage;
    this.spaceKey = spaceKey;
    this.initializeSpace(spaceKey);
  }

  get(identifier) {
    if (this.getSpaceAsObject()[identifier.key] !== undefined) {
      const persistedModel = this.getSpaceAsObject()[identifier.key];
      const domainObject = {
        identifier,
        ...persistedModel
      };

      return Promise.resolve(domainObject);
    } else {
      return Promise.resolve(undefined);
    }
  }

  getAllObjects() {
    return this.getSpaceAsObject();
  }

  create(object) {
    return this.persistObject(object);
  }

  update(object) {
    return this.persistObject(object);
  }

  /**
   * @private
   */
  persistObject(domainObject) {
    let space = this.getSpaceAsObject();
    space[domainObject.identifier.key] = domainObject;

    this.persistSpace(space);

    return Promise.resolve(true);
  }

  /**
   * @private
   */
  persistSpace(space) {
    this.localStorage[this.spaceKey] = JSON.stringify(space);
  }

  /**
   * @private
   */
  getSpace() {
    return this.localStorage[this.spaceKey];
  }

  /**
   * @private
   */
  getSpaceAsObject() {
    return JSON.parse(this.getSpace());
  }

  /**
   * @private
   */
  initializeSpace() {
    if (this.isEmpty()) {
      this.localStorage[this.spaceKey] = JSON.stringify({});
    }
  }

  /**
   * @private
   */
  isEmpty() {
    return this.getSpace() === undefined;
  }
}
