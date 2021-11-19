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
 * Provides a service
 * to manage instances of Worker and SharedWorker
 * to run background threads
**/
export default class WorkerAPI {
    constructor() {
        this.workerUrls = {};
        this.sharedWorkers = {};
    }

    /**
     * Add and register a worker.
     *
     * This will return either a Worker or a SharedWorker,
     * depending on whether a `shared` flag has been specified
     * in the definition for the referenced worker.
     *
     * @param {Object} worker definition object for the worker
    **/
    addWorker(worker) {
        const key = worker.key;

        if (!this.workerUrls[key]) {
            if (worker.scriptUrl) {
                this.workerUrls[key] = [
                    worker.bundle.path,
                    worker.bundle.sources,
                    worker.scriptUrl
                ].join("/");
            } else if (worker.scriptText) {
                const blob = new Blob(
                    [worker.scriptText],
                    {type: 'application/javascript'}
                );
                const objectUrl = URL.createObjectURL(blob);

                this.workerUrls[key] = objectUrl;
            }

            this.sharedWorkers[key] = worker.shared;
        }
    }

    /**
     * Start running a new web worker. This will run a worker
     * that has been added using @method addWorker.
     *
     * This will return either a Worker or a SharedWorker,
     * depending on whether a `shared` flag has been specified
     * in the definition for the referenced worker.
     *
     * @param {string} key symbolic identifier for the worker
     * @returns {Worker | SharedWorker} the running Worker
    **/
    run(key) {
        const scriptUrl = this.workerUrls[key];
        const Worker = this.sharedWorkers[key]
            ? window.SharedWorker
            : window.Worker;

        return scriptUrl && Worker && new Worker(scriptUrl);
    }
}
