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

import { createOpenMct } from 'testTools';
import ConditionSetPlugin from './plugin';

describe('The plugin', () => {
    let openmct;
    let conditionSetDefinition;
    let element;
    let child;

    beforeEach((done) => {
        const appHolder = document.createElement('div');
        appHolder.style.width = '640px';
        appHolder.style.height = '480px';

        openmct = createOpenMct();

        element = document.createElement('div');
        child = document.createElement('div');
        element.appendChild(child);

        openmct.install(new ConditionSetPlugin());
        conditionSetDefinition = openmct.types.get('conditionSet').definition;

        openmct.on('start', done);
        openmct.start(appHolder);
    });

    it('defines an object type with the correct key', () => {
        expect(conditionSetDefinition.key).toEqual('conditionSet');
    });

    it('defines an object type that is creatable', () => {
        expect(conditionSetDefinition.creatable).toBeTrue();
    });

    fit('provides a view', () => {
        const testViewObject = {
            id:"test-object",
            type: "conditionSet"
        };

        const applicableViews = openmct.objectViews.get(testViewObject);
        let conditionSetView = applicableViews.find((viewProvider) => viewProvider.key === 'conditionSet.view');
        expect(conditionSetView).toBeDefined();
    });

    describe('provides an object', () => {
        it('which initializes with an empty composition list', () => {
            let mockDomainObject = {
                identifier: {
                    key: 'test-key',
                    namespace: ''
                },
                type: 'conditionSet'
            };

            conditionSetDefinition.initialize(mockDomainObject);
            expect(mockDomainObject.composition instanceof Array).toBeTrue();
            expect(mockDomainObject.composition.length).toEqual(0);
        });
    });

});
