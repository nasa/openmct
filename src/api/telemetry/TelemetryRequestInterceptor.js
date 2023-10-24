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

export default class TelemetryRequestInterceptorRegistry {
  /**
   * A TelemetryRequestInterceptorRegistry maintains the definitions for different interceptors that may be invoked on telemetry
   * requests.
   * @interface TelemetryRequestInterceptorRegistry
   * @memberof module:openmct
   */
  constructor() {
    this.interceptors = [];
  }

  /**
   * @interface TelemetryRequestInterceptorDef
   * @property {function} appliesTo function that determines if this interceptor should be called for the given identifier/request
   * @property {function} invoke function that transforms the provided request and returns the transformed request
   * @property {function} priority the priority for this interceptor. A higher number returned has more weight than a lower number
   * @memberof module:openmct TelemetryRequestInterceptorRegistry#
   */

  /**
   * Register a new telemetry request interceptor.
   *
   * @param {module:openmct.RequestInterceptorDef} requestInterceptorDef the interceptor to add
   * @method addInterceptor
   * @memberof module:openmct.TelemetryRequestInterceptorRegistry#
   */
  addInterceptor(interceptorDef) {
    //TODO: sort by priority
    this.interceptors.push(interceptorDef);
  }

  /**
   * Retrieve all interceptors applicable to a domain object/request.
   * @method getInterceptors
   * @returns [module:openmct.RequestInterceptorDef] the registered interceptors for this identifier/request
   * @memberof module:openmct.TelemetryRequestInterceptorRegistry#
   */
  getInterceptors(identifier, request) {
    return this.interceptors.filter((interceptor) => {
      return (
        typeof interceptor.appliesTo === 'function' && interceptor.appliesTo(identifier, request)
      );
    });
  }
}
