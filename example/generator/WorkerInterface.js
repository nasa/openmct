/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2016, United States Government
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

define([
    'text!./generatorWorker.js',
    'uuid'
], function (
    workerText,
    uuid
) {

    var workerBlob = new Blob(
        [workerText],
        {type: 'application/javascript'}
    );
    var workerUrl = URL.createObjectURL(workerBlob);

    function WorkerInterface() {
        this.worker = new Worker(workerUrl);
        this.worker.onmessage = this.onMessage.bind(this);
        this.callbacks = {};
    }

    WorkerInterface.prototype.onMessage = function (message) {
        message = message.data;
        var callback = this.callbacks[message.id];
        if (callback) {
            if (callback(message)) {
                delete this.callbacks[message.id];
            }
        }
    };

    WorkerInterface.prototype.dispatch = function (request, data, callback) {
        var message = {
            request: request,
            data: data,
            id: uuid()
        };

        if (callback) {
            this.callbacks[message.id] = callback;
        }

        this.worker.postMessage(message);

        return message.id;
    };

    WorkerInterface.prototype.request = function (request) {
        var deferred = {};
        var promise = new Promise(function (resolve, reject) {
            deferred.resolve = resolve;
            deferred.reject = reject;
        });

        function callback(message) {
            if (message.error) {
                deferred.reject(message.error);
            } else {
                deferred.resolve(message.data);
            }
            return true;
        }

        this.dispatch('request', request, callback);

        return promise;
    };

    WorkerInterface.prototype.subscribe = function (request, cb) {
        var isCancelled = false;

        var callback = function (message) {
            if (isCancelled) {
                return true;
            }
            cb(message.data);
        };

        var messageId = this.dispatch('subscribe', request, callback)

        return function () {
            isCancelled = true;
            this.dispatch('unsubscribe', {
                id: messageId
            });
        }.bind(this);

    };




    return WorkerInterface;
});
