
import PlanActivitiesView from "./PlanActivitiesView.vue";
import Vue from 'vue';

export default function PlanInspectorViewProvider(openmct) {
    return {
        key: 'plan-inspector',
        name: 'Plan Inspector View',
        canView: function (selection) {
            if (selection.length === 0 || selection[0].length === 0) {
                return false;
            }

            let context = selection[0][0].context;

            return context
                && context.type === 'activity';
        },
        view: function (selection) {
            let component;

            return {
                show: function (element) {
                    component = new Vue({
                        el: element,
                        components: {
                            PlanActivitiesView: PlanActivitiesView
                        },
                        provide: {
                            openmct,
                            selection: selection
                        },
                        template: '<plan-activities-view></plan-activities-view>'
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
