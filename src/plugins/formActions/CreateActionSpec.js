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
import CreateAction from './CreateAction';

import {
    createOpenMct,
    resetApplicationState
} from 'utils/testing';

import { debounce } from 'lodash';

let parentObject;
let parentObjectPath;
let unObserve;

describe("The create action plugin", () => {
    let openmct;

    beforeEach((done) => {
        openmct = createOpenMct();

        openmct.on('start', done);
        openmct.startHeadless();
    });

    afterEach(() => {
        return resetApplicationState(openmct);
    });

    describe('creates new objects for a', () => {
        beforeEach(() => {
            parentObject = {
                name: 'mock folder',
                type: 'folder',
                identifier: {
                    key: 'mock-folder',
                    namespace: ''
                },
                composition: []
            };
            parentObjectPath = [parentObject];

            spyOn(openmct.objects, 'save');
            openmct.objects.save.and.callThrough();
            spyOn(openmct.forms, 'showForm');
            openmct.forms.showForm.and.callFake(formStructure => {
                return Promise.resolve({
                    name: 'test',
                    notes: 'test notes',
                    location: parentObjectPath
                });
            });
        });

        afterEach(() => {
            parentObject = null;
            unObserve();
        });

        it('type clock', (done) => {
            const type = 'clock';

            function callback(newObject) {
                const composition = newObject.composition;

                openmct.objects.get(composition[0])
                    .then(object => {
                        expect(object.type).toEqual(type);
                        expect(object.location).toEqual(openmct.objects.makeKeyString(parentObject.identifier));

                        done();
                    });
            }

            const deBouncedCallback = debounce(callback, 300);

            unObserve = openmct.objects.observe(parentObject, '*', deBouncedCallback);

            const createAction = new CreateAction(openmct, type, parentObject);
            createAction.invoke();
        });

        it('type conditionSet', (done) => {
            const type = 'conditionSet';

            function callback(newObject) {
                const composition = newObject.composition;

                openmct.objects.get(composition[0])
                    .then(object => {
                        expect(object.type).toEqual(type);
                        expect(object.location).toEqual(openmct.objects.makeKeyString(parentObject.identifier));

                        done();
                    });
            }

            const deBouncedCallback = debounce(callback, 300);

            unObserve = openmct.objects.observe(parentObject, '*', deBouncedCallback);

            const createAction = new CreateAction(openmct, type, parentObject);
            createAction.invoke();
        });

        it('type conditionWidget', (done) => {
            const type = 'conditionWidget';

            function callback(newObject) {
                const composition = newObject.composition;

                openmct.objects.get(composition[0])
                    .then(object => {
                        expect(object.type).toEqual(type);
                        expect(object.location).toEqual(openmct.objects.makeKeyString(parentObject.identifier));

                        done();
                    });
            }

            const deBouncedCallback = debounce(callback, 300);

            unObserve = openmct.objects.observe(parentObject, '*', deBouncedCallback);

            const createAction = new CreateAction(openmct, type, parentObject);
            createAction.invoke();
        });

        it('type example.imagery', (done) => {
            const type = 'example.imagery';

            function callback(newObject) {
                const composition = newObject.composition;

                openmct.objects.get(composition[0])
                    .then(object => {
                        expect(object.type).toEqual(type);
                        expect(object.location).toEqual(openmct.objects.makeKeyString(parentObject.identifier));

                        done();
                    });
            }

            const deBouncedCallback = debounce(callback, 300);

            unObserve = openmct.objects.observe(parentObject, '*', deBouncedCallback);

            const createAction = new CreateAction(openmct, type, parentObject);
            createAction.invoke();
        });

        it('type example.state-generator', (done) => {
            const type = 'example.state-generator';

            function callback(newObject) {
                const composition = newObject.composition;

                openmct.objects.get(composition[0])
                    .then(object => {
                        expect(object.type).toEqual(type);
                        expect(object.location).toEqual(openmct.objects.makeKeyString(parentObject.identifier));

                        done();
                    });
            }

            const deBouncedCallback = debounce(callback, 300);

            unObserve = openmct.objects.observe(parentObject, '*', deBouncedCallback);

            const createAction = new CreateAction(openmct, type, parentObject);
            createAction.invoke();
        });

        it('type flexible-layout', (done) => {
            const type = 'flexible-layout';

            function callback(newObject) {
                const composition = newObject.composition;

                openmct.objects.get(composition[0])
                    .then(object => {
                        expect(object.type).toEqual(type);
                        expect(object.location).toEqual(openmct.objects.makeKeyString(parentObject.identifier));

                        done();
                    });
            }

            const deBouncedCallback = debounce(callback, 300);

            unObserve = openmct.objects.observe(parentObject, '*', deBouncedCallback);

            const createAction = new CreateAction(openmct, type, parentObject);
            createAction.invoke();
        });

        it('type folder', (done) => {
            const type = 'folder';

            function callback(newObject) {
                const composition = newObject.composition;

                openmct.objects.get(composition[0])
                    .then(object => {
                        expect(object.type).toEqual(type);
                        expect(object.location).toEqual(openmct.objects.makeKeyString(parentObject.identifier));

                        done();
                    });
            }

            const deBouncedCallback = debounce(callback, 300);

            unObserve = openmct.objects.observe(parentObject, '*', deBouncedCallback);

            const createAction = new CreateAction(openmct, type, parentObject);
            createAction.invoke();
        });

        it('type generator', (done) => {
            const type = 'generator';

            function callback(newObject) {
                const composition = newObject.composition;

                openmct.objects.get(composition[0])
                    .then(object => {
                        expect(object.type).toEqual(type);
                        expect(object.location).toEqual(openmct.objects.makeKeyString(parentObject.identifier));

                        done();
                    });
            }

            const deBouncedCallback = debounce(callback, 300);

            unObserve = openmct.objects.observe(parentObject, '*', deBouncedCallback);

            const createAction = new CreateAction(openmct, type, parentObject);
            createAction.invoke();
        });

        it('type hyperlink', (done) => {
            const type = 'hyperlink';

            function callback(newObject) {
                const composition = newObject.composition;

                openmct.objects.get(composition[0])
                    .then(object => {
                        expect(object.type).toEqual(type);
                        expect(object.location).toEqual(openmct.objects.makeKeyString(parentObject.identifier));

                        done();
                    });
            }

            const deBouncedCallback = debounce(callback, 300);

            unObserve = openmct.objects.observe(parentObject, '*', deBouncedCallback);

            const createAction = new CreateAction(openmct, type, parentObject);
            createAction.invoke();
        });

        it('type LadTable', (done) => {
            const type = 'LadTable';

            function callback(newObject) {
                const composition = newObject.composition;

                openmct.objects.get(composition[0])
                    .then(object => {
                        expect(object.type).toEqual(type);
                        expect(object.location).toEqual(openmct.objects.makeKeyString(parentObject.identifier));

                        done();
                    });
            }

            const deBouncedCallback = debounce(callback, 300);

            unObserve = openmct.objects.observe(parentObject, '*', deBouncedCallback);

            const createAction = new CreateAction(openmct, type, parentObject);
            createAction.invoke();
        });

        it('type LadTableSet', (done) => {
            const type = 'LadTableSet';

            function callback(newObject) {
                const composition = newObject.composition;

                openmct.objects.get(composition[0])
                    .then(object => {
                        expect(object.type).toEqual(type);
                        expect(object.location).toEqual(openmct.objects.makeKeyString(parentObject.identifier));

                        done();
                    });
            }

            const deBouncedCallback = debounce(callback, 300);

            unObserve = openmct.objects.observe(parentObject, '*', deBouncedCallback);

            const createAction = new CreateAction(openmct, type, parentObject);
            createAction.invoke();
        });

        it('type layout', (done) => {
            const type = 'layout';

            function callback(newObject) {
                const composition = newObject.composition;

                openmct.objects.get(composition[0])
                    .then(object => {
                        expect(object.type).toEqual(type);
                        expect(object.location).toEqual(openmct.objects.makeKeyString(parentObject.identifier));

                        done();
                    });
            }

            const deBouncedCallback = debounce(callback, 300);

            unObserve = openmct.objects.observe(parentObject, '*', deBouncedCallback);

            const createAction = new CreateAction(openmct, type, parentObject);
            createAction.invoke();
        });

        it('type notebook', (done) => {
            const type = 'notebook';

            function callback(newObject) {
                const composition = newObject.composition;

                openmct.objects.get(composition[0])
                    .then(object => {
                        expect(object.type).toEqual(type);
                        expect(object.location).toEqual(openmct.objects.makeKeyString(parentObject.identifier));

                        done();
                    });
            }

            const deBouncedCallback = debounce(callback, 300);

            unObserve = openmct.objects.observe(parentObject, '*', deBouncedCallback);

            const createAction = new CreateAction(openmct, type, parentObject);
            createAction.invoke();
        });

        it('type plan', (done) => {
            const type = 'plan';

            function callback(newObject) {
                const composition = newObject.composition;

                openmct.objects.get(composition[0])
                    .then(object => {
                        expect(object.type).toEqual(type);
                        expect(object.location).toEqual(openmct.objects.makeKeyString(parentObject.identifier));

                        done();
                    });
            }

            const deBouncedCallback = debounce(callback, 300);

            unObserve = openmct.objects.observe(parentObject, '*', deBouncedCallback);

            const createAction = new CreateAction(openmct, type, parentObject);
            createAction.invoke();
        });

        it('type table', (done) => {
            const type = 'table';

            function callback(newObject) {
                const composition = newObject.composition;

                openmct.objects.get(composition[0])
                    .then(object => {
                        expect(object.type).toEqual(type);
                        expect(object.location).toEqual(openmct.objects.makeKeyString(parentObject.identifier));

                        done();
                    });
            }

            const deBouncedCallback = debounce(callback, 300);

            unObserve = openmct.objects.observe(parentObject, '*', deBouncedCallback);

            const createAction = new CreateAction(openmct, type, parentObject);
            createAction.invoke();
        });

        it('type tabs', (done) => {
            const type = 'tabs';

            function callback(newObject) {
                const composition = newObject.composition;

                openmct.objects.get(composition[0])
                    .then(object => {
                        expect(object.type).toEqual(type);
                        expect(object.location).toEqual(openmct.objects.makeKeyString(parentObject.identifier));

                        done();
                    });
            }

            const deBouncedCallback = debounce(callback, 300);

            unObserve = openmct.objects.observe(parentObject, '*', deBouncedCallback);

            const createAction = new CreateAction(openmct, type, parentObject);
            createAction.invoke();
        });

        it('type telemetry-mean', (done) => {
            const type = 'telemetry-mean';

            function callback(newObject) {
                const composition = newObject.composition;

                openmct.objects.get(composition[0])
                    .then(object => {
                        expect(object.type).toEqual(type);
                        expect(object.location).toEqual(openmct.objects.makeKeyString(parentObject.identifier));

                        done();
                    });
            }

            const deBouncedCallback = debounce(callback, 300);

            unObserve = openmct.objects.observe(parentObject, '*', deBouncedCallback);

            const createAction = new CreateAction(openmct, type, parentObject);
            createAction.invoke();
        });

        it('type telemetry.plot.bar-graph', (done) => {
            const type = 'telemetry.plot.bar-graph';

            function callback(newObject) {
                const composition = newObject.composition;

                openmct.objects.get(composition[0])
                    .then(object => {
                        expect(object.type).toEqual(type);
                        expect(object.location).toEqual(openmct.objects.makeKeyString(parentObject.identifier));

                        done();
                    });
            }

            const deBouncedCallback = debounce(callback, 300);

            unObserve = openmct.objects.observe(parentObject, '*', deBouncedCallback);

            const createAction = new CreateAction(openmct, type, parentObject);
            createAction.invoke();
        });

        it('type telemetry.plot.overlay', (done) => {
            const type = 'telemetry.plot.overlay';

            function callback(newObject) {
                const composition = newObject.composition;

                openmct.objects.get(composition[0])
                    .then(object => {
                        expect(object.type).toEqual(type);
                        expect(object.location).toEqual(openmct.objects.makeKeyString(parentObject.identifier));

                        done();
                    });
            }

            const deBouncedCallback = debounce(callback, 300);

            unObserve = openmct.objects.observe(parentObject, '*', deBouncedCallback);

            const createAction = new CreateAction(openmct, type, parentObject);
            createAction.invoke();
        });

        it('type telemetry.plot.stacked', (done) => {
            const type = 'telemetry.plot.stacked';

            function callback(newObject) {
                const composition = newObject.composition;

                openmct.objects.get(composition[0])
                    .then(object => {
                        expect(object.type).toEqual(type);
                        expect(object.location).toEqual(openmct.objects.makeKeyString(parentObject.identifier));

                        done();
                    });
            }

            const deBouncedCallback = debounce(callback, 300);

            unObserve = openmct.objects.observe(parentObject, '*', deBouncedCallback);

            const createAction = new CreateAction(openmct, type, parentObject);
            createAction.invoke();
        });

        it('type time-strip', (done) => {
            const type = 'time-strip';

            function callback(newObject) {
                const composition = newObject.composition;

                openmct.objects.get(composition[0])
                    .then(object => {
                        expect(object.type).toEqual(type);
                        expect(object.location).toEqual(openmct.objects.makeKeyString(parentObject.identifier));

                        done();
                    });
            }

            const deBouncedCallback = debounce(callback, 300);

            unObserve = openmct.objects.observe(parentObject, '*', deBouncedCallback);

            const createAction = new CreateAction(openmct, type, parentObject);
            createAction.invoke();
        });

        it('type timer', (done) => {
            const type = 'timer';

            function callback(newObject) {
                const composition = newObject.composition;

                openmct.objects.get(composition[0])
                    .then(object => {
                        expect(object.type).toEqual(type);
                        expect(object.location).toEqual(openmct.objects.makeKeyString(parentObject.identifier));

                        done();
                    });
            }

            const deBouncedCallback = debounce(callback, 300);

            unObserve = openmct.objects.observe(parentObject, '*', deBouncedCallback);

            const createAction = new CreateAction(openmct, type, parentObject);
            createAction.invoke();
        });

        it('type webpage', (done) => {
            const type = 'webpage';

            function callback(newObject) {
                const composition = newObject.composition;

                openmct.objects.get(composition[0])
                    .then(object => {
                        expect(object.type).toEqual(type);
                        expect(object.location).toEqual(openmct.objects.makeKeyString(parentObject.identifier));

                        done();
                    });
            }

            const deBouncedCallback = debounce(callback, 300);

            unObserve = openmct.objects.observe(parentObject, '*', deBouncedCallback);

            const createAction = new CreateAction(openmct, type, parentObject);
            createAction.invoke();
        });

        it('type mmgis', (done) => {
            const type = 'mmgis';

            function callback(newObject) {
                const composition = newObject.composition;

                openmct.objects.get(composition[0])
                    .then(object => {
                        expect(object.type).toEqual(type);
                        expect(object.location).toEqual(openmct.objects.makeKeyString(parentObject.identifier));

                        done();
                    });
            }

            const deBouncedCallback = debounce(callback, 300);

            unObserve = openmct.objects.observe(parentObject, '*', deBouncedCallback);

            const createAction = new CreateAction(openmct, type, parentObject);
            createAction.invoke();
        });
    });
});
