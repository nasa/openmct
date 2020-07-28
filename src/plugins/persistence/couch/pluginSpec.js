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
    resetApplicationState
} from 'utils/testing';
import CouchObjectProvider from "@/plugins/persistence/couch/CouchObjectProvider";
import CouchObjectQueue from "@/plugins/persistence/couch/CouchObjectQueue";

describe("the plugin", () => {
    let openmct;
    let element;
    let child;
    let provider;
    let testSpace = "testSpace";
    let testPath = "/test/db";
    let mockDomainObject = { identifier: {namespace: '', key: "some-value"} };

    beforeEach((done) => {
        openmct = createOpenMct(false);
        openmct.install(new CouchPlugin(testSpace, testPath));

        element = document.createElement('div');
        child = document.createElement('div');
        element.appendChild(child);

        openmct.on('start', done);
        openmct.startHeadless();

        provider = openmct.objects.getProvider(mockDomainObject.identifier);
    });

    it('registers a provider for objects', () => {
        expect(provider).toBeDefined();
    });

    it('gets an object', () => {
        openmct.objects.get(mockDomainObject.identifier).then((result) => {
            expect(provider.get).toHaveBeenCalled();
            expect(result).toBeDefined();
        });
    });

    it('creates an object', () => {
        openmct.objects.save(mockDomainObject).then((result) => {
            expect(provider.create).toHaveBeenCalled();
            expect(result).toBeDefined();
        });
    });

    it('updates an object', () => {
        openmct.objects.save(mockDomainObject).then((result) => {
            openmct.objects.save(mockDomainObject).then((updatedResult) => {
                expect(provider.update).toHaveBeenCalled();
                expect(updatedResult).toBeDefined();
            });
        });
    });

    it('updates queued objects', () => {
        let couchProvider = new CouchObjectProvider(openmct, 'http://localhost', '');
        couchProvider.objectQueue[mockDomainObject.identifier.key] = new CouchObjectQueue({
            mockDomainObject,
            intermediateResponse: couchProvider.getIntermediateResponse()
        });
        spyOn(couchProvider, 'updateQueued');
        couchProvider.update(mockDomainObject);
        setTimeout(() => {
            expect(couchProvider.updateQueued).toHaveBeenCalledTimes(2);
        }, 100);
    });
});
