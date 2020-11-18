/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2020, United States Government
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
export default class InterceptorRegistry {
    /**
     * @interceptorDef InterceptorDefinition
     * @memberof module:openmct.InterceptorRegistry~
     * @property {string} key the key for this interceptor
     * @property {function (identifier, object)} a function which implements
     *           any modifications to objects and returns the modified object
     */

    /**
     * A InterceptorRegistry maintains the definitions for different interceptors
     * that domain objects may have.
     * @interface InterceptorRegistry
     * @memberof module:openmct
     */
    constructor() {
        this.interceptors = {};
    }

    /**
     * Register a new object interceptor.
     *
     * @param {string} key a string identifier for this interceptor
     * @param {module:openmct.Interceptor} interceptor the interceptor to add
     * @method addInterceptor
     * @memberof module:openmct.InterceptorRegistry#
     */
    addInterceptor(key, interceptorDef) {
        //TODO: sort by priority
        this.interceptors[key] = interceptorDef;
    }

    /**
     * List keys for all registered interceptors.
     * @method listKeys
     * @memberof module:openmct.InterceptorRegistry#
     * @returns {string[]} all registered interceptor keys
     */
    listKeys() {
        return Object.keys(this.interceptors);
    }

    /**
     * Retrieve a registered interceptor by its key.
     * @method get
     * @param {string} key the key for this interceptor
     * @memberof module:openmct.InterceptorRegistry#
     * @returns {module:openmct.Interceptor} the registered interceptor
     */
    get(key) {
        return this.interceptors[key];
    }

    /**
     * Retrieve all interceptors for a domain object.
     * @method getInterceptors
     * @returns {module:openmct.Interceptor} the registered interceptor
     */
    getInterceptors(identifier, object) {
        return Object.values(this.interceptors).filter(interceptor => {
            return typeof interceptor.appliesTo === 'function'
                && interceptor.appliesTo(identifier, object);
        });
    }

}

