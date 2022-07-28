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

import utils from './utils';

export default function () {
    return function install(openmct) {
        openmct.install(openmct.plugins.FaultManagement());

        const faultsData = utils.randomFaults();

        openmct.faults.addProvider({
            request(domainObject, options) {
                return Promise.resolve(faultsData);
            },
            subscribe(domainObject, callback) {

                function getRandomIndex(start, end) {
                    return Math.floor(start + (Math.random() * (end - start + 1)));
                }

                let id = setInterval(() => {
                    const index = getRandomIndex(0, faultsData.length - 1);
                    const randomFaultData = faultsData[index];
                    const randomFault = randomFaultData.fault;

                    callback({
                        fault: randomFault,
                        type: 'alarms'
                    });
                }, 300);

                return () => {
                    clearInterval(id);
                };
            },
            supportsRequest(domainObject) {
                return domainObject.type === 'faultManagement';
            },
            supportsSubscribe(domainObject) {
                return domainObject.type === 'faultManagement';
            },
            acknowledgeFault(fault, { comment = '' }) {
                utils.acknowledgeFault(fault);

                return Promise.resolve({
                    success: true
                });
            },
            shelveFault(fault, duration) {
                utils.shelveFault(fault, duration);

                return Promise.resolve({
                    success: true
                });
            }
        });
    };
}
