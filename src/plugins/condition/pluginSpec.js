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

import { createOpenMct } from "testTools";
import ConditionPlugin from "./plugin";

let openmct;
let conditionDefinition;
let conditionSetDefinition;
let mockDomainObject;

describe('the plugin', function () {

    beforeEach(() => {
        openmct = createOpenMct();
        openmct.install(new ConditionPlugin());
        conditionDefinition = openmct.types.get('condition').definition;
        conditionSetDefinition = openmct.types.get('conditionSet').definition;
    });

    let mockConditionObject = {
        name: 'Condition',
        key: 'condition',
        creatable: false
    };

    it('defines a condition object type with the correct key', () => {
        expect(conditionDefinition.key).toEqual(mockConditionObject.key);
    });

    let mockConditionSetObject = {
        name: 'Condition Set',
        key: 'conditionSet',
        creatable: true
    };

    it('defines a conditionSet object type with the correct key', () => {
        expect(conditionSetDefinition.key).toEqual(mockConditionSetObject.key);
    });

    describe('the condition object', () => {
        beforeEach(() => {
            mockDomainObject = {
                identifier: {
                    key: 'testConditionKey',
                    namespace: ''
                },
                type: 'condition'
            };

            conditionDefinition.initialize(mockDomainObject);
        });

        it('is not creatable', () => {
            expect(conditionDefinition.creatable).toEqual(mockConditionObject.creatable);
        });

        it('initializes with an empty composition list', () => {
            expect(mockDomainObject.composition instanceof Array).toBeTrue();
            expect(mockDomainObject.composition.length).toEqual(0);
        });
    });

    describe('the conditionSet object', () => {
        let element;
        let child;

        beforeEach((done) => {
            const appHolder = document.createElement('div');
            appHolder.style.width = '640px';
            appHolder.style.height = '480px';

            element = document.createElement('div');
            child = document.createElement('div');
            element.appendChild(child);

            mockDomainObject = {
                identifier: {
                    key: 'testConditionSetKey',
                    namespace: ''
                },
                type: 'conditionSet'
            };

            conditionSetDefinition.initialize(mockDomainObject);

            openmct.on('start', done);
            openmct.start(appHolder);
        });

        it('is not creatable', () => {
            expect(conditionSetDefinition.creatable).toEqual(mockConditionSetObject.creatable);
        });

        it('initializes with an empty composition list', () => {
            expect(mockDomainObject.composition instanceof Array).toBeTrue();
            expect(mockDomainObject.composition.length).toEqual(0);
        });

        it('provides a view', () => {
            const testViewObject = {
                id:"test-object",
                type: "conditionSet"
            };

            const applicableViews = openmct.objectViews.get(testViewObject);
            let conditionSetView = applicableViews.find((viewProvider) => viewProvider.key === 'conditionSet.view');
            expect(conditionSetView).toBeDefined();
        });

    });
});
