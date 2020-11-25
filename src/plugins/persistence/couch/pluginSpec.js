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
import CouchPlugin from './plugin.js';
import {
    createOpenMct,
    resetApplicationState, spyOnBuiltins
} from 'utils/testing';
import CouchObjectProvider from './CouchObjectProvider';

describe('the plugin', () => {
    let openmct;
    let element;
    let child;
    let provider;
    let testPath = '/test/db';
    let mockDomainObject;

    beforeEach((done) => {
        mockDomainObject = {
            identifier: {
                namespace: 'mct',
                key: 'some-value'
            }
        };
        openmct = createOpenMct(false);
        openmct.install(new CouchPlugin(testPath));

        element = document.createElement('div');
        child = document.createElement('div');
        element.appendChild(child);

        openmct.on('start', done);
        openmct.startHeadless();

        provider = openmct.objects.getProvider(mockDomainObject.identifier);
        spyOn(provider, 'get').and.callThrough();
        spyOn(provider, 'create').and.callThrough();
        spyOn(provider, 'update').and.callThrough();

        spyOnBuiltins(['fetch'], window);
        fetch.and.returnValue(Promise.resolve({
            json: () => {
                return {
                    ok: true,
                    _id: 'some-value',
                    _rev: 1,
                    model: {}
                };
            }
        }));
    });

    afterEach(() => {
        return resetApplicationState(openmct);
    });

    it('gets an object', () => {
        openmct.objects.get(mockDomainObject.identifier).then((result) => {
            expect(result.identifier.key).toEqual(mockDomainObject.identifier.key);
        });
    });

    it('creates an object', () => {
        openmct.objects.save(mockDomainObject).then((result) => {
            expect(provider.create).toHaveBeenCalled();
            expect(result).toBeTrue();
        });
    });

    it('updates an object', () => {
        openmct.objects.save(mockDomainObject).then((result) => {
            expect(result).toBeTrue();
            expect(provider.create).toHaveBeenCalled();
            openmct.objects.save(mockDomainObject).then((updatedResult) => {
                expect(updatedResult).toBeTrue();
                expect(provider.update).toHaveBeenCalled();
            });
        });
    });

    it('updates queued objects', () => {
        let couchProvider = new CouchObjectProvider(openmct, 'http://localhost', '');
        let intermediateResponse = couchProvider.getIntermediateResponse();
        spyOn(couchProvider, 'updateQueued');
        couchProvider.enqueueObject(mockDomainObject.identifier.key, mockDomainObject, intermediateResponse);
        couchProvider.objectQueue[mockDomainObject.identifier.key].updateRevision(1);
        couchProvider.update(mockDomainObject);
        expect(couchProvider.objectQueue[mockDomainObject.identifier.key].hasNext()).toBe(2);
        couchProvider.checkResponse({
            ok: true,
            rev: 2,
            id: mockDomainObject.identifier.key
        }, intermediateResponse);

        expect(couchProvider.updateQueued).toHaveBeenCalledTimes(2);
    });
});
