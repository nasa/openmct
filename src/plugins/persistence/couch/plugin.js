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

import CouchObjectProvider from './CouchObjectProvider';
import CouchSearchProvider from './CouchSearchProvider';
import CouchStatusIndicator from './CouchStatusIndicator';

const NAMESPACE = '';
const LEGACY_SPACE = 'mct';
const COUCH_SEARCH_ONLY_NAMESPACE = `COUCH_SEARCH_${Date.now()}`;

export default function CouchPlugin(options) {
  return function install(openmct) {
    const simpleIndicator = openmct.indicators.simpleIndicator();
    openmct.indicators.add(simpleIndicator);
    const couchStatusIndicator = new CouchStatusIndicator(simpleIndicator);
    install.couchProvider = new CouchObjectProvider(
      openmct,
      options,
      NAMESPACE,
      couchStatusIndicator
    );

    // Unfortunately, for historical reasons, Couch DB produces objects with a mix of namepaces (alternately "mct", and "")
    // Installing the same provider under both namespaces means that it can respond to object gets for both namespaces.
    openmct.objects.addProvider(LEGACY_SPACE, install.couchProvider);
    openmct.objects.addProvider(NAMESPACE, install.couchProvider);
    openmct.objects.addProvider(
      COUCH_SEARCH_ONLY_NAMESPACE,
      new CouchSearchProvider(install.couchProvider)
    );
  };
}
