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

export default class LADTableConfiguration extends EventEmitter {
  constructor(domainObject, openmct) {
    super();

    this.domainObject = domainObject;
    this.openmct = openmct;

    this.objectMutated = this.objectMutated.bind(this);
    this.unlistenFromMutation = openmct.objects.observe(
      domainObject,
      'configuration',
      this.objectMutated
    );
  }

  getConfiguration() {
    const configuration = this.domainObject.configuration || {};
    configuration.hiddenColumns = configuration.hiddenColumns || {};
    configuration.isFixedLayout = configuration.isFixedLayout ?? true;

    return configuration;
  }

  updateConfiguration(configuration) {
    this.openmct.objects.mutate(this.domainObject, 'configuration', configuration);
  }

  objectMutated(configuration) {
    if (configuration !== undefined) {
      this.emit('change', configuration);
    }
  }

  destroy() {
    this.unlistenFromMutation();
  }
}
