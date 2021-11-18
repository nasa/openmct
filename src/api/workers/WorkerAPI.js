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

export default class WorkerAPI {
    constructor() {
        this.workerUrls = {};
        this.sharedWorkers = {};
    }

    addWorker(worker) {
        const key = worker.key;

        if (!this.workerUrls[key]) {
            if (worker.scriptUrl) {
                console.log('add worker.scriptUrl', worker.scriptUrl);
                this.workerUrls[key] = [
                    worker.bundle.path,
                    worker.bundle.sources,
                    worker.scriptUrl
                ].join("/");
            } else if (worker.scriptText) {
                console.log('add worker.scriptText', worker.scriptText);
                const blob = new Blob(
                    [worker.scriptText],
                    {type: 'application/javascript'}
                );
                const objectUrl = URL.createObjectURL(blob);

                console.log('objectUrl', objectUrl);

                this.workerUrls[key] = objectUrl;
            }

            this.sharedWorkers[key] = worker.shared;
        }
    }

    run(key) {
        console.log('worker api.run', key);

        const scriptUrl = this.workerUrls[key];
        const Worker = this.sharedWorkers[key]
            ? window.SharedWorker
            : window.Worker;

        console.log('scripturl', scriptUrl);
        console.log('worker', Worker);
        console.log('window worker?', Worker === window.Worker);

        return scriptUrl && Worker && new Worker(scriptUrl);
    }
}
