import FaultManagementView from './FaultManagementView.vue';

import Vue from 'vue';

export const FAULT_MANAGER_VIEW = 'fault.view';

export default class FaultManagementViewProvider {
    constructor(openmct) {
        this.openmct = openmct;
        this.key = FAULT_MANAGER_VIEW;
    }

    canView(domainObject) {
        return domainObject.type === FAULT_MANAGER_VIEW;
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
