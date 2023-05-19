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

export const DEFAULT_CONFIGURATION = {
  clipActivityNames: false,
  swimlaneVisibility: {}
};

export default class PlanViewConfiguration extends EventEmitter {
  constructor(domainObject, openmct) {
    super();

    this.domainObject = domainObject;
    this.openmct = openmct;

    this.configurationChanged = this.configurationChanged.bind(this);
    this.unlistenFromMutation = openmct.objects.observe(
      domainObject,
      'configuration',
      this.configurationChanged
    );
  }

  /**
   * @returns {Object.<string, any>}
   */
  getConfiguration() {
    const configuration = this.domainObject.configuration ?? {};
    for (const configKey of Object.keys(DEFAULT_CONFIGURATION)) {
      configuration[configKey] = configuration[configKey] ?? DEFAULT_CONFIGURATION[configKey];
    }

    return configuration;
  }

  #updateConfiguration(configuration) {
    this.openmct.objects.mutate(this.domainObject, 'configuration', configuration);
  }

  /**
   * @param {string} swimlaneName
   * @param {boolean} isVisible
   */
  setSwimlaneVisibility(swimlaneName, isVisible) {
    const configuration = this.getConfiguration();
    const { swimlaneVisibility } = configuration;
    swimlaneVisibility[swimlaneName] = isVisible;
    this.#updateConfiguration(configuration);
  }

  resetSwimlaneVisibility() {
    const configuration = this.getConfiguration();
    const swimlaneVisibility = {};
    configuration.swimlaneVisibility = swimlaneVisibility;
    this.#updateConfiguration(configuration);
  }

  initializeSwimlaneVisibility(swimlaneNames) {
    const configuration = this.getConfiguration();
    const { swimlaneVisibility } = configuration;
    let shouldMutate = false;
    for (const swimlaneName of swimlaneNames) {
      if (swimlaneVisibility[swimlaneName] === undefined) {
        swimlaneVisibility[swimlaneName] = true;
        shouldMutate = true;
      }
    }

    if (shouldMutate) {
      configuration.swimlaneVisibility = swimlaneVisibility;
      this.#updateConfiguration(configuration);
    }
  }

  /**
   * @param {boolean} isEnabled
   */
  setClipActivityNames(isEnabled) {
    const configuration = this.getConfiguration();
    configuration.clipActivityNames = isEnabled;
    this.#updateConfiguration(configuration);
  }

  configurationChanged(configuration) {
    if (configuration !== undefined) {
      this.emit('change', configuration);
    }
  }

  destroy() {
    this.unlistenFromMutation();
  }
}
