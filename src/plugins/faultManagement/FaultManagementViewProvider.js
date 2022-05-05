import FaultManagementView from './FaultManagementView.vue';
import { FAULT_MANAGEMENT_VIEW } from './constants';
import Vue from 'vue';

export default class FaultManagementViewProvider {
    constructor(openmct) {
        this.openmct = openmct;
        this.key = FAULT_MANAGEMENT_VIEW;
    }

    canView(domainObject) {
        return domainObject.type === FAULT_MANAGEMENT_VIEW;
    }

    canEdit(domainObject) {
        return false;
    }

    view(domainObject) {
        let component;
        const openmct = this.openmct;

        return {
            show: (element) => {
                component = new Vue({
                    el: element,
                    components: {
                        FaultManagementView
                    },
                    provide: {
                        openmct,
                        domainObject
                    },
                    template: '<FaultManagementView></FaultManagementView>'
                });
            },
            destroy: () => {
                if (!component) {
                    return;
                }

                component.$destroy();
                component = undefined;
            }
        };
    }
}
