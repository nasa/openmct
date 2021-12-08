/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2021, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT is licensed under the Apache License, Version 2.0 (the
 * 'License'); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 *
 * Open MCT includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/

/**
 *  SearchSpec. Created by shale on 07/31/2015.
 */
define([
    "raw-loader!../../src/services/BareBonesSearchWorker.js"
], function (
    BareBonesSearchWorkerText
) {
    describe('BareBonesSearchWorker', function () {
        let blob;
        let objectUrl;
        let worker;
        let objectX;
        let objectY;
        let objectZ;
        let itemsToIndex;

        beforeEach(function () {
            blob = new Blob(
                [BareBonesSearchWorkerText],
                {type: 'application/javascript'}
            );
            objectUrl = URL.createObjectURL(blob);
            worker = new Worker(objectUrl);

            objectX = {
                id: 'x',
                model: {name: 'object xx'}
            };
            objectY = {
                id: 'y',
                model: {name: 'object yy'}
            };
            objectZ = {
                id: 'z',
                model: {name: 'object zz'}
            };
            itemsToIndex = [
                objectX,
                objectY,
                objectZ
            ];

            itemsToIndex.forEach(function (item) {
                worker.postMessage({
                    request: 'index',
                    id: item.id,
                    model: item.model
                });
            });
        });

        afterEach(function () {
            blob = undefined;
            objectUrl = undefined;
            worker.terminate();
        });

        it('returns search results for partial term matches', function (done) {
            worker.addEventListener('message', function (message) {
                let data = message.data;

                expect(data.request).toBe('search');
                expect(data.total).toBe(3);
                expect(data.queryId).toBe(123);
                expect(data.results.length).toBe(3);
                expect(data.results[0].id).toBe('x');
                expect(data.results[0].name).toEqual(objectX.model.name);
                expect(data.results[1].id).toBe('y');
                expect(data.results[1].name).toEqual(objectY.model.name);
                expect(data.results[2].id).toBe('z');
                expect(data.results[2].name).toEqual(objectZ.model.name);

                done();
            });

            worker.postMessage({
                request: 'search',
                input: 'obj',
                maxResults: 100,
                queryId: 123
            });
        });

        it('can find partial term matches', function (done) {
            worker.addEventListener('message', function (message) {
                let data = message.data;

                expect(data.queryId).toBe(345);
                expect(data.results.length).toBe(1);
                expect(data.results[0].id).toBe('x');

                done();
            });

            worker.postMessage({
                request: 'search',
                input: 'x',
                maxResults: 100,
                queryId: 345
            });
        });
    });
});
