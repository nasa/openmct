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

export default function () {
    return function install(openmct) {
        openmct.install(openmct.plugins.FaultManagement());

        openmct.faults.addProvider({
            request(domainObject, options) {
                const faults = JSON.parse(localStorage.getItem('faults'));

                return Promise.resolve(faults.alarms);
            },
            subscribe(domainObject, callback) {
                const faultsData = JSON.parse(localStorage.getItem('faults')).alarms;

                function getRandomIndex(start, end) {
                    return Math.floor(start + (Math.random() * (end - start + 1)));
                }

                let id = setInterval(() => {
                    const index = getRandomIndex(0, faultsData.length - 1);
                    const randomFaultData = faultsData[index];
                    const randomFault = randomFaultData.fault;
                    randomFault.currentValueInfo.value = Math.random();
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
                const faults = localStorage.getItem('faults');

                return faults && domainObject.type === 'faultManagement';
            },
            supportsSubscribe(domainObject) {
                const faults = localStorage.getItem('faults');

                return faults && domainObject.type === 'faultManagement';
            },
            acknowledgeFault(fault, { comment = '' }) {
                console.log('acknowledgeFault', fault);
                console.log('comment', comment);

                return Promise.resolve({
                    success: true
                });
            },
            shelveFault(fault, shelveData) {
                console.log('shelveFault', fault);
                console.log('shelveData', shelveData);

                return Promise.resolve({
                    success: true
                });
            }
        });
    };
}
