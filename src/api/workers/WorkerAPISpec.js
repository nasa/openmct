/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2021, United States Government
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

import WorkerAPI from './WorkerAPI';

describe('The Worker API', () => {
    let workerAPI;
    let mockWorkers;
    let mockWorker;
    let mockSharedWorker;

    beforeEach(() => {
        mockWorkers = [
            {
                key: 'abc',
                scriptUrl: 'c.js',
                bundle: {
                    path: 'a',
                    sources: 'b'
                }
            },
            {
                key: 'xyz',
                scriptUrl: 'z.js',
                bundle: {
                    path: 'x',
                    sources: 'y'
                }
            },
            {
                key: 'xyz',
                scriptUrl: 'bad.js',
                bundle: {
                    path: 'bad',
                    sources: 'bad'
                }
            },
            {
                key: 'a-shared-worker',
                shared: true,
                scriptUrl: 'c.js',
                bundle: {
                    path: 'a',
                    sources: 'b'
                }
            },
            {
                key: 'text-worker',
                scriptText: '(()=>{}());'
            }
        ];

        mockWorker = {};
        mockSharedWorker = {};

        spyOn(window, 'Worker').and.returnValue(mockWorker);
        spyOn(window, 'SharedWorker').and.returnValue(mockSharedWorker);

        workerAPI = new WorkerAPI();

        mockWorkers.forEach(worker => workerAPI.addWorker(worker));
    });

    it('instantiates workers at registered paths', () => {
        expect(workerAPI.run('abc')).toBe(mockWorker);
        expect(window.Worker).toHaveBeenCalledWith('a/b/c.js');
    });

    it('prefers the first worker when multiple keys are found', () => {
        expect(workerAPI.run('xyz')).toBe(mockWorker);
        expect(window.Worker).toHaveBeenCalledWith('x/y/z.js');
    });

    it('allows workers to be shared', () => {
        expect(workerAPI.run('a-shared-worker')).toBe(mockSharedWorker);
        expect(window.SharedWorker)
            .toHaveBeenCalledWith('a/b/c.js');
    });

    it('returns undefined for unknown workers', () => {
        expect(workerAPI.run('def')).toBeUndefined();
    });

    it('instatiates workers from strings', () => {
        expect(workerAPI.run('text-worker')).toBe(mockWorker);
    });
});
