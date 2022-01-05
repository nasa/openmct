import { createOpenMct, resetApplicationState } from "utils/testing";
import ConditionWidgetPlugin from "./plugin";
import Vue from 'vue';

describe('the plugin', function () {
    let objectDef;
    let element;
    let child;
    let openmct;
    let mockObjectPath;

    beforeEach((done) => {
        mockObjectPath = [
            {
                name: 'mock folder',
                type: 'fake-folder',
                identifier: {
                    key: 'mock-folder',
                    namespace: ''
                }
            },
            {
                name: 'mock parent folder',
                type: 'conditionWidget',
                identifier: {
                    key: 'mock-parent-folder',
                    namespace: ''
                }
            }
        ];

        const timeSystem = {
            timeSystemKey: 'utc',
            bounds: {
                start: 1597160002854,
                end: 1597181232854
            }
        };

        openmct = createOpenMct(timeSystem);
        openmct.install(new ConditionWidgetPlugin());

        objectDef = openmct.types.get('conditionWidget').definition;

        element = document.createElement('div');
        element.style.width = '640px';
        element.style.height = '480px';
        child = document.createElement('div');
        child.style.width = '640px';
        child.style.height = '480px';
        element.appendChild(child);

        openmct.on('start', done);
        openmct.startHeadless();
    });

    afterEach(() => {
        return resetApplicationState(openmct);
    });

    let mockObject = {
        name: 'Condition Widget',
        key: 'conditionWidget',
        creatable: true
    };

    it('defines a conditionWidget object type with the correct key', () => {
        expect(objectDef.key).toEqual(mockObject.key);
    });

    describe('the conditionWidget object', () => {
        it('is creatable', () => {
            expect(objectDef.creatable).toEqual(mockObject.creatable);
        });
    });

    describe('the view', () => {
        let conditionWidgetView;
        let testViewObject;

        beforeEach(() => {
            testViewObject = {
                id: "test-object",
                identifier: {
                    key: "test-object",
                    namespace: ''
                },
                type: "conditionWidget"
            };

            const applicableViews = openmct.objectViews.get(testViewObject, mockObjectPath);
            conditionWidgetView = applicableViews.find((viewProvider) => viewProvider.key === 'conditionWidget');
            let view = conditionWidgetView.view(testViewObject, element);
            view.show(child, true);

            return Vue.nextTick();
        });

        it('provides a view', () => {
            expect(conditionWidgetView).toBeDefined();
        });
    });
});
