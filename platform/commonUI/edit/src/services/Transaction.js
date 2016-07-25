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
define([], function () {
    function Transaction($log) {
        this.$log = $log;
        this.callbacks = [];
    }

    Transaction.prototype.add = function (commit, cancel) {
        var callback = { commit: commit, cancel: cancel };
        this.callbacks.push(callback);
        return function () {
            this.callbacks = this.callbacks.filter(function (c) {
                return c !== callback;
            });
        }.bind(this);
    };

    Transaction.prototype.size = function () {
        return this.callbacks.length;
    };

    ['commit', 'cancel'].forEach(function (method) {
        Transaction.prototype[method] = function () {
            var promises = [];
            var callback;

            while (this.callbacks.length > 0) {
                callback = this.callbacks.shift();
                try {
                    promises.push(callback[method]());
                } catch (e) {
                    this.$log
                        .error("Error trying to " + method + " transaction.");
                }
            }

            return Promise.all(promises);
        };
    });


    return Transaction;
});
