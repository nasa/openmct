/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2021, United States Government
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

/**
 * Module defining InMemorySearchWorker. Created by deeptailor on 10/03/2019.
 */
(function () {
    // An object composed of domain object IDs and models
    // {id: domainObject's ID, name: domainObject's name}
    const indexedItems = {};

    self.onconnect = function (e) {
        const port = e.ports[0];

        port.onmessage = function (event) {
            if (event.data.request === 'index') {
                indexItem(event.data.keyString, event.data.model);
            } else if (event.data.request === 'search') {
                port.postMessage(search(event.data));
            }
        };

        port.start();

    };

    self.onerror = function (error) {
        //do nothing
        console.error('Error on feed', error);
    };

    function indexItem(keyString, model) {
        indexedItems[keyString] = {
            type: model.type,
            name: model.name,
            keyString
        };
    }

    /**
     * Gets search results from the indexedItems based on provided search
     *   input. Returns matching results from indexedItems
     *
     * @param data An object which contains:
     *           * input: The original string which we are searching with
     *           * maxResults: The maximum number of search results desired
     *           * queryId: an id identifying this query, will be returned.
     */
    function search(data) {
        // This results dictionary will have domain object ID keys which
        // point to the value the domain object's score.
        let results;
        const input = data.input.trim().toLowerCase();
        const message = {
            request: 'search',
            results: {},
            total: 0,
            queryId: data.queryId
        };

        results = Object.values(indexedItems).filter((indexedItem) => {
            return indexedItem.name.toLowerCase().includes(input);
        });

        message.total = results.length;
        message.results = results
            .slice(0, data.maxResults);

        return message;
    }
}());
