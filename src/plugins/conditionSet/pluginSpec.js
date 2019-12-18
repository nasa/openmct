/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2019, United States Government
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

import ConditionSetPlugin from './plugin';
import { createOpenMct } from 'testTools';

describe("The plugin", () => {
    let openmct;
    let mockDomainObject;

    beforeEach(() => {
        openmct = createOpenMct();
        openmct.install(new ConditionSetPlugin());

        mockDomainObject = {
            identifier: {
                key: 'testKey',
                namespace: ''
            },
            type: 'conditionSet'
        };
    });

    it('defines a conditionSet object type with the correct key', () => {
        expect(openmct.types.get('conditionSet').definition.key).toEqual('conditionSet');
    });

    it('defines a conditionSet object type that is creatable', () => {
        expect(openmct.types.get('conditionSet').definition.creatable).toBeTrue();
    });

    describe("shows the conditionSet object is initialized with", () => {
        beforeEach(() => {
            openmct.types.get('conditionSet').definition.initialize(mockDomainObject);
        });

        it('a composition array', () => {
            expect(Array.isArray(mockDomainObject.composition)).toBeTrue();
        });

        // it('a telemetry object', () => {
        //     expect(typeof mockDomainObject.telemetry === 'object').toBeTrue();
        // });
    });
});

