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

import {createMouseEvent, createOpenMct} from "testUtils";
import ImageryPlugin from "./plugin";
import Vue from 'vue';

describe('the plugin', function () {
    let element;
    let child;
    let openmct;

    beforeEach((done) => {
        openmct = createOpenMct();
        openmct.install(new ImageryPlugin());

        element = document.createElement('div');
        child = document.createElement('div');
        element.appendChild(child);

        openmct.on('start', done);
        openmct.startHeadless();
    });

    it('provides an imagery view for telemetry with images', () => {
        const testObject = {
            id:"test-object",
            type: "example.imagery",
            telemetry: {
                values: [
                    {
                        name: 'Name',
                        key: 'name'
                    },
                    {
                        name: 'Time',
                        key: 'utc',
                        format: 'utc',
                        hints: {
                            domain: 1
                        }
                    },
                    {
                        name: 'Image',
                        key: 'url',
                        format: 'image',
                        layers: [
                            {
                                source: 'dist/images/bg-splash.jpg',
                                name: 'Big Splash'
                            },
                            {
                                source: 'dist/images/logo-nasa.svg',
                                name: 'Nasa Logo'
                            }
                        ],
                        hints: {
                            image: 1
                        }
                    }
                ]
            }
        };

        const applicableViews = openmct.objectViews.get(testObject);
        let imageryView = applicableViews.find((viewProvider) => viewProvider.key === 'example.imagery');
        expect(imageryView).toBeDefined();
    });

    describe("The imagery view", () => {
        let testTelemetryObject;
        let applicableViews;
        let imageryViewProvider;
        let imageryView;

        beforeEach(() => {
            testTelemetryObject = {
                identifier:{ namespace: "", key: "test-object"},
                type: "test-object",
                name: "Test Object",
                telemetry: {
                    values: [{
                        key: "some-key",
                        name: "Some attribute",
                        hints: {
                            domain: 1
                        }
                    },
                    {
                        name: 'Time',
                        key: 'utc',
                        format: 'utc',
                        hints: {
                            domain: 1
                        }
                    },
                    {
                        key: "some-other-key",
                        name: "Another attribute",
                        format: 'image',
                        hints: {
                            image: 1
                        },
                        layers: [
                            {
                                source: 'dist/imagery/example-imagery-layer-16x9.png',
                                name: '16:9'
                            },
                            {
                                source: 'dist/imagery/example-imagery-layer-safe.png',
                                name: 'Safe'
                            }
                        ]
                    }]
                }
            };
            applicableViews = openmct.objectViews.get(testTelemetryObject);
            imageryViewProvider = applicableViews.find((viewProvider) => viewProvider.key === 'example.imagery');
            imageryView = imageryViewProvider.view(testTelemetryObject, true, [testTelemetryObject]);
            imageryView.show(child, true);
            return Vue.nextTick();
        });

        it("Renders an image filters menu button",() => {
            let filtersMenuSwitcher = element.querySelectorAll('button.c-button--menu.icon-brightness');
            expect(filtersMenuSwitcher.length).toBe(1);
            expect(filtersMenuSwitcher[0].title).toBe('Filters menu');
        });

        it("Shows the filters controls",() => {
            let filtersMenuSwitcher = element.querySelectorAll('button.c-button--menu.icon-brightness');
            expect(filtersMenuSwitcher.length).toBe(1);
            expect(filtersMenuSwitcher[0].title).toBe('Filters menu');
            let event = createMouseEvent('click');
            filtersMenuSwitcher[0].dispatchEvent(event);
            return Vue.nextTick().then(() => {
                let filtersMenu = element.querySelectorAll('button.c-button--menu.icon-brightness + .c-switcher-menu__content');
                expect(filtersMenu.length).toBe(1);
                let filtersSliders = element.querySelectorAll('.c-image-controls__sliders');
                expect(filtersSliders.length).toBe(1);
            });
        });

        it("Shows the layers controls",() => {
            let layersMenuSwitcher = element.querySelectorAll('button.c-button--menu.icon-layers');
            expect(layersMenuSwitcher.length).toBe(1);
            expect(layersMenuSwitcher[0].title).toBe('Layers menu');
            let event = createMouseEvent('click');
            layersMenuSwitcher[0].dispatchEvent(event);
            return Vue.nextTick().then(() => {
                let layersMenu = element.querySelectorAll('button.c-button--menu.icon-layers + .c-switcher-menu__content');
                expect(layersMenu.length).toBe(1);
                let layers = element.querySelectorAll('.js-checkbox-menu li');
                expect(layers.length).toBe(2);
            });
        });

    });

    describe("The imagery view for creatable objects", () => {
        let testCreatableImageryObject;
        let applicableViews;
        let imageryViewProvider;
        let imageryView;

        beforeEach(() => {
            testCreatableImageryObject = {
                identifier:{ namespace: "", key: "test-object"},
                type: "example.imagery",
                name: "Test Object",
                configuration: {
                    layers: [
                        {
                            source: 'dist/imagery/example-imagery-layer-16x9.png',
                            name: '16:9',
                            visible: true
                        },
                        {
                            source: 'dist/imagery/example-imagery-layer-safe.png',
                            name: 'Safe'
                        }
                    ]
                },
                telemetry: {
                    values: [{
                        key: "some-key",
                        name: "Some attribute",
                        hints: {
                            domain: 1
                        }
                    },
                    {
                        name: 'Time',
                        key: 'utc',
                        format: 'utc',
                        hints: {
                            domain: 1
                        }
                    },
                    {
                        key: "some-other-key",
                        name: "Another attribute",
                        format: 'image',
                        hints: {
                            image: 1
                        },
                        layers: [
                            {
                                source: 'dist/imagery/example-imagery-layer-16x9.png',
                                name: '16:9'
                            },
                            {
                                source: 'dist/imagery/example-imagery-layer-safe.png',
                                name: 'Safe'
                            }
                        ]
                    }]
                }
            };
            applicableViews = openmct.objectViews.get(testCreatableImageryObject);
            imageryViewProvider = applicableViews.find((viewProvider) => viewProvider.key === 'example.imagery');
            imageryView = imageryViewProvider.view(testCreatableImageryObject, true, [testCreatableImageryObject]);
            imageryView.show(child, true);
            return Vue.nextTick();
        });

        it("shows previously visible layers",() => {
            let layersMenuSwitcher = element.querySelectorAll('button.c-button--menu.icon-layers');
            expect(layersMenuSwitcher.length).toBe(1);
            expect(layersMenuSwitcher[0].title).toBe('Layers menu');
            let event = createMouseEvent('click');
            layersMenuSwitcher[0].dispatchEvent(event);
            return Vue.nextTick().then(() => {
                let layersMenu = element.querySelectorAll('button.c-button--menu.icon-layers + .c-switcher-menu__content');
                expect(layersMenu.length).toBe(1);
                let layers = element.querySelectorAll('.js-checkbox-menu input[checked]');
                expect(layers.length).toBe(1);
            });
        });

        it("saves visible layers",() => {
            let layersMenuSwitcher = element.querySelectorAll('button.c-button--menu.icon-layers');
            expect(layersMenuSwitcher.length).toBe(1);
            expect(layersMenuSwitcher[0].title).toBe('Layers menu');
            let event = createMouseEvent('click');
            layersMenuSwitcher[0].dispatchEvent(event);
            return Vue.nextTick().then(() => {
                let layersMenu = element.querySelectorAll('button.c-button--menu.icon-layers + .c-switcher-menu__content');
                expect(layersMenu.length).toBe(1);
                let checkedlayers = element.querySelectorAll('.js-checkbox-menu input[checked]');
                expect(checkedlayers.length).toBe(1);
                let uncheckedLayers = element.querySelectorAll('.js-checkbox-menu input:not([checked])');
                expect(uncheckedLayers.length).toBe(1);
                uncheckedLayers[0].dispatchEvent(event);
                return Vue.nextTick().then(() => {
                    imageryView.destroy();
                    return Vue.nextTick().then(() => {
                        const visibleLayers = testCreatableImageryObject.configuration.layers.filter((layer) => {
                            return layer.visible === true;
                        });
                        expect(visibleLayers.length).toBe(2);
                    });

                });
            });
        });

        it("does not save layers for imagery objects that cannot be saved",() => {
            let testImageryObject = Object.assign({}, testCreatableImageryObject);
            delete testImageryObject.configuration;

            let layersMenuSwitcher = element.querySelectorAll('button.c-button--menu.icon-layers');
            expect(layersMenuSwitcher.length).toBe(1);
            expect(layersMenuSwitcher[0].title).toBe('Layers menu');
            let event = createMouseEvent('click');
            layersMenuSwitcher[0].dispatchEvent(event);
            return Vue.nextTick().then(() => {
                let layersMenu = element.querySelectorAll('button.c-button--menu.icon-layers + .c-switcher-menu__content');
                expect(layersMenu.length).toBe(1);
                let checkedlayers = element.querySelectorAll('.js-checkbox-menu input[checked]');
                expect(checkedlayers.length).toBe(1);
                let uncheckedLayers = element.querySelectorAll('.js-checkbox-menu input:not([checked])');
                expect(uncheckedLayers.length).toBe(1);
                uncheckedLayers[0].dispatchEvent(event);
                return Vue.nextTick().then(() => {
                    imageryView.destroy();
                    return Vue.nextTick().then(() => {
                        const visibleLayers = testCreatableImageryObject.configuration.layers.filter((layer) => {
                            return layer.visible === true;
                        });
                        expect(visibleLayers.length).toBe(2);
                    });

                });
            });
        });
    });

    describe("The imagery view for objects that are not creatable", () => {
        let testImageryObject;
        let applicableViews;
        let imageryViewProvider;
        let imageryView;

        beforeEach(() => {
            testImageryObject = {
                identifier:{ namespace: "", key: "test-object"},
                type: "example.imagery",
                name: "Test Object",
                telemetry: {
                    values: [{
                        key: "some-key",
                        name: "Some attribute",
                        hints: {
                            domain: 1
                        }
                    },
                    {
                        name: 'Time',
                        key: 'utc',
                        format: 'utc',
                        hints: {
                            domain: 1
                        }
                    },
                    {
                        key: "some-other-key",
                        name: "Another attribute",
                        format: 'image',
                        hints: {
                            image: 1
                        },
                        layers: [
                            {
                                source: 'dist/imagery/example-imagery-layer-16x9.png',
                                name: '16:9'
                            },
                            {
                                source: 'dist/imagery/example-imagery-layer-safe.png',
                                name: 'Safe'
                            }
                        ]
                    }]
                }
            };
            applicableViews = openmct.objectViews.get(testImageryObject);
            imageryViewProvider = applicableViews.find((viewProvider) => viewProvider.key === 'example.imagery');
            imageryView = imageryViewProvider.view(testImageryObject, true, [testImageryObject]);
            imageryView.show(child, true);
            return Vue.nextTick();
        });

        it("does not show previously visible layers on load",() => {
            let layersMenuSwitcher = element.querySelectorAll('button.c-button--menu.icon-layers');
            expect(layersMenuSwitcher.length).toBe(1);
            expect(layersMenuSwitcher[0].title).toBe('Layers menu');
            let event = createMouseEvent('click');
            layersMenuSwitcher[0].dispatchEvent(event);
            return Vue.nextTick().then(() => {
                let layersMenu = element.querySelectorAll('button.c-button--menu.icon-layers + .c-switcher-menu__content');
                expect(layersMenu.length).toBe(1);
                let layers = element.querySelectorAll('.js-checkbox-menu input[checked]');
                expect(layers.length).toBe(0);
            });
        });

        it("does not save visible layers",() => {
            let layersMenuSwitcher = element.querySelectorAll('button.c-button--menu.icon-layers');
            expect(layersMenuSwitcher.length).toBe(1);
            expect(layersMenuSwitcher[0].title).toBe('Layers menu');
            let event = createMouseEvent('click');
            layersMenuSwitcher[0].dispatchEvent(event);
            return Vue.nextTick().then(() => {
                let layersMenu = element.querySelectorAll('button.c-button--menu.icon-layers + .c-switcher-menu__content');
                expect(layersMenu.length).toBe(1);
                let checkedLayers = element.querySelectorAll('.js-checkbox-menu input[checked]');
                expect(checkedLayers.length).toBe(0);
                let uncheckedLayers = element.querySelectorAll('.js-checkbox-menu input:not([checked])');
                expect(uncheckedLayers.length).toBe(2);
                uncheckedLayers[0].dispatchEvent(event);
                return Vue.nextTick().then(() => {
                    imageryView.destroy();
                    return Vue.nextTick().then(() => {
                        expect(testImageryObject.configuration).toBeUndefined();
                    });

                });
            });
        });
    });
});
