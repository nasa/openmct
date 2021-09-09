import LadTableSet from './components/LadTableSet.vue';
import LADTable from './LADTable.js';

import Vue from 'vue';

export default class LadTableSetView {
    constructor(openmct, domainObject, objectPath) {
        this.openmct = openmct;
        this.domainObject = domainObject;
        this.objectPath = objectPath;
        this.component = undefined;
        this.table = new LADTable(domainObject, openmct);
    }

    show(element) {
        this.component = new Vue({
            el: element,
            components: {
                LadTableSet
            },
            provide: {
                openmct: this.openmct,
                objectPath: this.objectPath,
                currentView: this,
                table: this.table

            },
            data: () => {
                return {
                    domainObject: this.domainObject
                };
            },
            template: '<lad-table-set ref="ladTableSet" :domain-object="domainObject"></lad-table-set>'
        });
    }

    getViewContext() {
        if (!this.component) {
            return {};
        }

        return this.component.$refs.ladTableSet.getViewContext();
    }

    destroy(element) {
        this.component.$destroy();
        this.component = undefined;
    }
}
