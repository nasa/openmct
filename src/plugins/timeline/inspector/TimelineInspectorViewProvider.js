
import PlanProperties from "./PlanProperties.vue";
import Vue from 'vue';

export default function TimelineInspectorViewProvider(openmct) {
    return {
        key: 'plans-inspector',
        name: 'Plans Inspector View',
        canView: function (selection) {
            if (selection.length === 0 || selection[0].length === 0) {
                return false;
            }

            let object = selection[0][0].context.item;

            return object
                && object.type === 'plan';
        },
        view: function (selection) {
            let component;

            return {
                show: function (element) {
                    component = new Vue({
                        el: element,
                        components: {
                            PlanProperties
                        },
                        provide: {
                            openmct,
                            domainObject: openmct.selection.get()[0][0].context.item
                        },
                        template: '<plan-properties></plan-properties>'
                    });
                },
                destroy: function () {
                    if (component) {
                        component.$destroy();
                        component = undefined;
                    }
                }
            };
        },
        priority: function () {
            return 1;
        }
    };
}
