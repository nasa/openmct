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

import CouchObjectProvider from './CouchObjectProvider.js';
import CouchSearchProvider from './CouchSearchProvider.js';
import CouchStatusIndicator from './CouchStatusIndicator.js';

const DEFAULT_NAMESPACE = '';
const LEGACY_SPACE = 'mct';

export default function CouchPlugin(options) {
  function normalizeOptions(unnnormalizedOptions) {
    const normalizedOptions = {};
    if (typeof unnnormalizedOptions === 'string') {
      normalizedOptions.databases = [
        {
          url: options,
          namespace: DEFAULT_NAMESPACE,
          additionalNamespaces: [LEGACY_SPACE],
          readOnly: false,
          useDesignDocuments: false,
          indicator: true
        }
      ];
    } else if (!unnnormalizedOptions.databases) {
      normalizedOptions.databases = [
        {
          url: unnnormalizedOptions.url,
          namespace: DEFAULT_NAMESPACE,
          additionalNamespaces: [LEGACY_SPACE],
          readOnly: false,
          useDesignDocuments: unnnormalizedOptions.useDesignDocuments,
          indicator: true
        }
      ];
    } else {
      normalizedOptions.databases = unnnormalizedOptions.databases;
    }

    // final sanity check, ensure we have all options
    normalizedOptions.databases.forEach((databaseConfiguration) => {
      if (!databaseConfiguration.url) {
        throw new Error(
          `🛑 CouchDB plugin requires a url option. Please check the configuration for namespace ${databaseConfiguration.namespace}`
        );
      } else if (databaseConfiguration.namespace === undefined) {
        // note we can't check for just !databaseConfiguration.namespace because it could be an empty string
        throw new Error(
          `🛑 CouchDB plugin requires a namespace option. Please check the configuration for url ${databaseConfiguration.url}`
        );
      }
    });

    return normalizedOptions;
  }

  return function install(openmct) {
    const normalizedOptions = normalizeOptions(options);
    normalizedOptions.databases.forEach((databaseConfiguration) => {
      let couchStatusIndicator;
      if (databaseConfiguration.indicator) {
        const simpleIndicator = openmct.indicators.simpleIndicator();
        openmct.indicators.add(simpleIndicator);
        couchStatusIndicator = new CouchStatusIndicator(simpleIndicator);
      }
      // the provider is added to the install function to expose couchProvider to unit tests
      install.couchProvider = new CouchObjectProvider({
        openmct,
        databaseConfiguration,
        couchStatusIndicator
      });
      openmct.objects.addProvider(databaseConfiguration.namespace, install.couchProvider);
      databaseConfiguration.additionalNamespaces?.forEach((additionalNamespace) => {
        openmct.objects.addProvider(additionalNamespace, install.couchProvider);
      });

      // need one search provider for whole couch database
      const searchOnlyNamespace = `COUCH_SEARCH_${databaseConfiguration.namespace}${Date.now()}`;
      openmct.objects.addProvider(
        searchOnlyNamespace,
        new CouchSearchProvider(install.couchProvider)
      );
    });
  };
}
