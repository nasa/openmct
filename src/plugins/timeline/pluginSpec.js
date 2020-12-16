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

import { createOpenMct, resetApplicationState } from "utils/testing";
import TimelinePlugin from "./plugin";
import Vue from 'vue';
import TimelineViewLayout from "./TimelineViewLayout.vue";

describe('the plugin', function () {
    let planDefinition;
    let element;
    let child;
    let openmct;

    beforeEach((done) => {
        const appHolder = document.createElement('div');
        appHolder.style.width = '640px';
        appHolder.style.height = '480px';

        openmct = createOpenMct();
        openmct.install(new TimelinePlugin());

        planDefinition = openmct.types.get('plan').definition;

        element = document.createElement('div');
        element.style.width = '640px';
        element.style.height = '480px';
        child = document.createElement('div');
        child.style.width = '640px';
        child.style.height = '480px';
        element.appendChild(child);

        openmct.time.bounds({
            start: 1597160002854,
            end: 1597181232854
        });

        openmct.on('start', done);
        openmct.startHeadless(appHolder);
    });

    afterEach(() => {
        return resetApplicationState(openmct);
    });

    let mockPlanObject = {
        name: 'Plan',
        key: 'plan',
        creatable: true
    };

    it('defines a plan object type with the correct key', () => {
        expect(planDefinition.key).toEqual(mockPlanObject.key);
    });

    describe('the plan object', () => {

        it('is creatable', () => {
            expect(planDefinition.creatable).toEqual(mockPlanObject.creatable);
        });

        it('provides a timeline view', () => {
            const testViewObject = {
                id: "test-object",
                type: "plan"
            };

            const applicableViews = openmct.objectViews.get(testViewObject);
            let timelineView = applicableViews.find((viewProvider) => viewProvider.key === 'timeline.view');
            expect(timelineView).toBeDefined();
        });

    });

    describe('the timeline view displays activities', () => {
        let planDomainObject;
        let component;
        let planViewComponent;

        beforeEach((done) => {
            planDomainObject = {
                identifier: {
                    key: 'test-object',
                    namespace: ''
                },
                type: 'plan',
                id: "test-object",
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

            let viewContainer = document.createElement('div');
            child.append(viewContainer);
            component = new Vue({
                provide: {
                    openmct: openmct,
                    domainObject: planDomainObject
                },
                el: viewContainer,
                components: {
                    TimelineViewLayout
                },
                template: '<timeline-view-layout/>'
            });

            return Vue.nextTick().then(() => {
                planViewComponent = component.$root.$children[0].$children[0];
                setTimeout(() => {
                    clearInterval(planViewComponent.resizeTimer);
                    //TODO: this is a hack to ensure the canvas has a width - maybe there's a better way to set the width of the plan div
                    planViewComponent.width = 1200;
                    planViewComponent.setScaleAndPlotActivities();
                    done();
                }, 300);
            });
        });

        it('loads activities into the view', () => {
            expect(planViewComponent.json).toBeDefined();
            expect(planViewComponent.json["TEST-GROUP"].length).toEqual(2);
        });

        it('loads a time axis into the view', () => {
            let ticks = planViewComponent.axisElement.node().querySelectorAll('g.tick');
            expect(ticks.length).toEqual(11);
        });

        it('calculates the activity layout', () => {
            const expectedActivitiesByRow = {
                "0": [
                    {
                        "heading": "TEST-GROUP",
                        "activity": {
                            "color": "fuchsia",
                            "textColor": "black"
                        },
                        "textLines": [
                            "Lorem ipsum dolor sit amet, consectetur adipiscing elit, ",
                            "sed sed do eiusmod tempor incididunt ut labore et "
                        ],
                        "textStart": -47.51342439943476,
                        "textY": 12,
                        "start": -47.51625058878945,
                        "end": 204.97315120113046,
                        "rectWidth": -4.9971738106453145
                    }
                ],
                "42": [
                    {
                        "heading": "",
                        "activity": {
                            "color": "fuchsia",
                            "textColor": "black"
                        },
                        "textLines": [
                            "Sed ut perspiciatis "
                        ],
                        "textStart": -48.483749411210546,
                        "textY": 54,
                        "start": -52.99858690532266,
                        "end": 9.032501177578908,
                        "rectWidth": -0.48516250588788523
                    }
                ]
            };
            expect(Object.keys(planViewComponent.activitiesByRow)).toEqual(Object.keys(expectedActivitiesByRow));
        });
    });

});
