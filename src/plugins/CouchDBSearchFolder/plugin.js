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
export default function (folderName, couchPlugin, searchFilter) {
  const DEFAULT_NAME = 'CouchDB Documents';

  return function install(openmct) {
    const couchProvider = couchPlugin.couchProvider;
    //replace any non-letter/non-number with a hyphen
    const couchSearchId = (folderName || DEFAULT_NAME).replace(/[^a-zA-Z0-9]/g, '-');
    const couchSearchName = `couch-search-${couchSearchId}`;

    openmct.objects.addRoot({
      namespace: couchSearchName,
      key: couchSearchName
    });

    openmct.objects.addProvider(couchSearchName, {
      get(identifier) {
        if (identifier.key !== couchSearchName) {
          return undefined;
        } else {
          return Promise.resolve({
            identifier,
            type: 'folder',
            name: folderName || DEFAULT_NAME,
            location: 'ROOT'
          });
        }
      },
      search() {
        return Promise.resolve([]);
      }
    });

    openmct.composition.addProvider({
      appliesTo(domainObject) {
        return (
          domainObject.identifier.namespace === couchSearchName &&
          domainObject.identifier.key === couchSearchName
        );
      },
      load() {
        let searchResults;

        if (searchFilter.viewName !== undefined) {
          // Use a view to search, instead of an _all_docs find
          searchResults = couchProvider.getObjectsByView(searchFilter);
        } else {
          // Use the _find endpoint to search _all_docs
          searchResults = couchProvider.getObjectsByFilter(searchFilter);
        }

        return searchResults;
      }
    });
  };
}
