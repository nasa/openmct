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
/*global spyOn*/
define(() => {

        /**
         * An instrumented promise implementation for better control of promises
         * during tests.
         *
         */
        class ControlledPromise {
          constructor() {
            this.resolveHandlers = [];
            this.rejectHandlers = [];
            spyOn(this, 'then').andCallThrough();
          }


        /**
         * Resolve the promise, passing the supplied value to all resolve
         * handlers.
         */
        resolve(value) {
            this.resolveHandlers.forEach( (handler) => {
                handler(value);
            });
        };

        /**
         * Reject the promise, passing the supplied value to all rejection
         * handlers.
         */
        reject(value) {
            this.rejectHandlers.forEach( (handler) => {
                handler(value);
            });
        };

        /**
         * Standard promise.then, returns a promise that support chaining.
         * TODO: Need to support resolve/reject handlers that return promises.
         */
        then(onResolve, onReject) {
            let returnPromise = new ControlledPromise();

            if (onResolve) {
                this.resolveHandlers.push( (resolveWith) => {
                    var chainResult = onResolve(resolveWith);
                    if (chainResult && chainResult.then) {
                        // chainResult is a promise, resolve when it resolves.
                        chainResult.then( (pipedResult) => {
                            return returnPromise.resolve(pipedResult);
                        });
                    } else {
                        returnPromise.resolve(chainResult);
                    }
                });
            }

            if (onReject) {
                this.rejectHandlers.push( (rejectWith) => {
                    var chainResult = onReject(rejectWith);
                    if (chainResult && chainResult.then) {
                        chainResult.then( (pipedResult) => {
                            returnPromise.reject(pipedResult);
                        });
                    } else {
                        returnPromise.reject(chainResult);
                    }
                });
            }

            return returnPromise;
        };
      }
        return ControlledPromise;

    }
);
