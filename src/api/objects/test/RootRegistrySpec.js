/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2018, United States Government
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
define([
    '../RootRegistry'
], function (
    RootRegistry
) {
    describe('RootRegistry', function () {
        var idA,
            idB,
            idC,
            registry;

        beforeEach(function () {
            idA = {key: 'keyA', namespace: 'something'};
            idB = {key: 'keyB', namespace: 'something'};
            idC = {key: 'keyC', namespace: 'something'};
            registry = new RootRegistry();
        });

        it('can register a root by key', function (done) {
            registry.addRoot(idA);
            registry.getRoots()
                .then(function (roots) {
                    expect(roots).toEqual([idA]);
                })
                .then(done);
        });

        it('can register multiple roots by key', function (done) {
            registry.addRoot([idA, idB]);
            registry.getRoots()
                .then(function (roots) {
                    expect(roots).toEqual([idA, idB]);
                })
                .then(done);
        });

        it('can register an asynchronous root ', function (done) {
            registry.addRoot(function () {
                return Promise.resolve(idA);
            });
            registry.getRoots()
                .then(function (roots) {
                    expect(roots).toEqual([idA]);
                })
                .then(done);
        });

        it('can register multiple asynchronous roots', function (done) {
            registry.addRoot(function () {
                return Promise.resolve([idA, idB]);
            });
            registry.getRoots()
                .then(function (roots) {
                    expect(roots).toEqual([idA, idB]);
                })
                .then(done);
        });

        it('can combine different types of registration', function (done) {
            registry.addRoot([idA, idB]);
            registry.addRoot(function () {
                return Promise.resolve([idC]);
            });
            registry.getRoots()
                .then(function (roots) {
                    expect(roots).toEqual([idA, idB, idC]);
                })
                .then(done);
        });
    });
});
