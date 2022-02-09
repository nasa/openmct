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

import {createOpenMct, resetApplicationState} from "utils/testing";
import TimelistPlugin from "./plugin";
import Vue from 'vue';
import moment from "moment";

describe('the plugin', function () {
    let timelistDefinition;
    let element;
    let child;
    let openmct;
    let appHolder;
    let originalRouterPath;

    beforeEach((done) => {
        appHolder = document.createElement('div');
        appHolder.style.width = '640px';
        appHolder.style.height = '480px';

        openmct = createOpenMct();
        openmct.install(new TimelistPlugin());

        timelistDefinition = openmct.types.get('timelist').definition;

        element = document.createElement('div');
        element.style.width = '640px';
        element.style.height = '480px';
        child = document.createElement('div');
        child.style.width = '640px';
        child.style.height = '480px';
        element.appendChild(child);

        originalRouterPath = openmct.router.path;

        openmct.on('start', done);
        openmct.start(appHolder);
    });

    afterEach(() => {
        openmct.router.path = originalRouterPath;

        return resetApplicationState(openmct);
    });

    let mockTimelistObject = {
        name: 'Timelist',
        key: 'timelist',
        creatable: true
    };

    it('defines a timelist object type with the correct key', () => {
        expect(timelistDefinition.key).toEqual(mockTimelistObject.key);
    });

    it('is creatable', () => {
        expect(timelistDefinition.creatable).toEqual(mockTimelistObject.creatable);
    });

    describe('the timelist view', () => {
        it('provides a timelist view', () => {
            const testViewObject = {
                id: "test-object",
                type: "timelist"
            };
            openmct.router.path = [testViewObject];

            const applicableViews = openmct.objectViews.get(testViewObject, [testViewObject]);
            let timelistView = applicableViews.find((viewProvider) => viewProvider.key === 'timelist.view');
            expect(timelistView).toBeDefined();
        });
    });

    describe('the timelist view displays activities', () => {
        let timelistDomainObject;
        let timelistView;

        beforeEach(() => {
            timelistDomainObject = {
                identifier: {
                    key: 'test-object',
                    namespace: ''
                },
                type: 'timelist',
                id: "test-object",
                configuration: {
                    sortOrderIndex: 0,
                    futureEventsIndex: 1,
                    futureEventsDurationIndex: 0,
                    futureEventsDuration: 20,
                    currentEventsIndex: 1,
                    currentEventsDurationIndex: 0,
                    currentEventsDuration: 20,
                    pastEventsIndex: 1,
                    pastEventsDurationIndex: 0,
                    pastEventsDuration: 20,
                    filter: ''
                },
                selectFile: {
                    body: JSON.stringify({
                        "TEST-GROUP": [
                            {
                                "name": "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua",
                                "start": 1597170002854,
                                "end": 1597171032854,
                                "type": "TEST-GROUP",
                                "color": "fuchsia",
                                "textColor": "black"
                            },
                            {
                                "name": "Sed ut perspiciatis",
                                "start": 1597171132854,
                                "end": 1597171232854,
                                "type": "TEST-GROUP",
                                "color": "fuchsia",
                                "textColor": "black"
                            }
                        ]
                    })
                }
            };

            openmct.router.path = [timelistDomainObject];

            const applicableViews = openmct.objectViews.get(timelistDomainObject, [timelistDomainObject]);
            timelistView = applicableViews.find((viewProvider) => viewProvider.key === 'timelist.view');
            let view = timelistView.view(timelistDomainObject, []);
            view.show(child, true);

            return Vue.nextTick();
        });

        it('displays the activities', () => {
            const items = element.querySelectorAll('.c-table__body .c-list-item');
            expect(items.length).toEqual(2);
        });

        it('displays the activity headers', () => {
            const headers = element.querySelectorAll('.c-table__body th');
            expect(headers.length).toEqual(4);
        });

        it('displays activity details', (done) => {
            Vue.nextTick(() => {
                const itemEls = element.querySelectorAll('.c-table__body .c-list-item');
                const itemValues = itemEls[0].querySelectorAll('.c-list-item__value');
                expect(itemValues.length).toEqual(4);
                expect(itemValues[3].innerHTML.trim()).toEqual('Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua');
                expect(itemValues[0].innerHTML.trim()).toEqual(`${moment(1597170002854).format('YYYY-MM-DD HH:mm:ss:SSS')}Z`);
                expect(itemValues[1].innerHTML.trim()).toEqual(`${moment(1597171032854).format('YYYY-MM-DD HH:mm:ss:SSS')}Z`);

                done();
            });
        });
    });
});
