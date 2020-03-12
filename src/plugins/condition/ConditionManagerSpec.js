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

import ConditionManager  from './ConditionManager';

describe('ConditionManager', () => {

    let conditionMgr;
    let mockListener;
    let openmct = {};
    let mockCondition = {
        isDefault: true,
        type: 'condition',
        id: '1234-5678',
        configuration: {
            criteria: []
        }
    };
    let conditionSetDomainObject = {
        identifier: {
            namespace: "",
            key: "600a7372-8d48-4dc4-98b6-548611b1ff7e"
        },
        type: "conditionSet",
        location: "mine",
        configuration: {
            conditionCollection: [
                mockCondition
            ]
        }
    };

    function mockAngularComponents() {
        let mockInjector = jasmine.createSpyObj('$injector', ['get']);

        let mockInstantiate = jasmine.createSpy('mockInstantiate');
        mockInstantiate.and.returnValue(mockInstantiate);

        let mockDomainObject = {
            useCapability: function () {
                return mockCondition;
            }
        };
        mockInstantiate.and.callFake(function () {
            return mockDomainObject;
        });
        mockInjector.get.and.callFake(function (service) {
            return {
                'instantiate': mockInstantiate
            }[service];
        });

        openmct.$injector = mockInjector;
    }

    beforeAll(function () {

        mockAngularComponents();

        openmct.objects = jasmine.createSpyObj('objects', ['get', 'makeKeyString', 'observe', 'mutate']);
        openmct.objects.get.and.returnValues(new Promise(function (resolve, reject) {
            resolve(conditionSetDomainObject);
        }), new Promise(function (resolve, reject) {
            resolve(mockCondition);
        }));
        openmct.objects.makeKeyString.and.returnValue(conditionSetDomainObject.identifier.key);
        openmct.objects.observe.and.returnValue(function () {});
        openmct.objects.mutate.and.returnValue(function () {});
        conditionMgr = new ConditionManager(conditionSetDomainObject, openmct);
        mockListener = jasmine.createSpy('mockListener');

        conditionMgr.on('conditionSetResultUpdated', mockListener);
    });

    it('creates a conditionCollection with a default condition', function () {
        expect(conditionMgr.conditionSetDomainObject.configuration.conditionCollection.length).toEqual(1);
        let defaultConditionId = conditionMgr.conditionClassCollection[0].id;
        expect(defaultConditionId).toEqual(mockCondition.id);
    });

});
