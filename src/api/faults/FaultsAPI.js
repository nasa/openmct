/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2022, United States Government
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

import EventEmitter from 'EventEmitter';

export const MULTIPLE_FAULTS_PROVIDER_ERROR = 'Only one faults provider may be set at a time.';
export const NO_FAULTS_PROVIDER_ERROR = 'No faults provider has been set.';

export default class FaultsAPI extends EventEmitter {
    constructor(openmct) {
        super();

        this._openmct = openmct;
        this._provider = undefined;
    }

    /**
     * Set the faults provider for the faults API. This allows to specifiy faults provider to be used with Open MCT.
     * @method setProvider
     * @memberof module:openmct.FaultsAPI#
     * @param {module:openmct.FaultsAPI~FaultsProvider} provider the new fault provider
     */
    setProvider(provider) {
        if (this.hasProvider()) {
            this._throwError(MULTIPLE_FAULTS_PROVIDER_ERROR);
        }

        this._provider = provider;

        this.emit('faultsProviderAdded', this._provider);
    }

    /**
     * Return true if the faults provider has been set.
     *
     * @memberof module:openmct.FaultsAPI#
     * @returns {boolean} true if the faults provider exists
     */
    hasProvider() {
        return this._provider !== undefined;
    }

    /**
     * If a faults provider is set, it will return a copy of a faults object from
     * the provider. If the faults is not logged in, it will return undefined;
     *
     * @memberof module:openmct.FaultsAPI#
     * @returns {Function|Promise} faults provider 'getCurrentfaults' method
     * @throws Will throw an error if no faults provider is set
     */
    getProvider() {
        this._noProviderCheck();

        return this._provider;
    }

    /**
     * Checks if a provider is set and if not, will throw error
     *
     * @private
     * @throws Will throw an error if no faults provider is set
     */
    _noProviderCheck() {
        if (!this.hasProvider()) {
            this._throwError(NO_FAULTS_PROVIDER_ERROR);
        }
    }

    /**
     * Utility function for throwing errors
     *
     * @private
     * @param {string} error description of error
     * @throws Will throw error passed in
     */
    _throwError(error) {
        throw new Error(error);
    }
}
