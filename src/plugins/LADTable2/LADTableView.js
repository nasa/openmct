import LadTable from '/src/plugins/telemetryTable/components/table.vue';
import TelemetryTable from '/src/plugins/telemetryTable/TelemetryTable.js';
import Vue from 'vue';

export default class LADTableView extends TelemetryTable {
    constructor(openmct, domainObject, objectPath) {
        super(openmct, domainObject, objectPath);
        this.openmct = openmct;
        this.domainObject = domainObject;
        this.objectPath = objectPath;
        this.component = undefined;
    }

    show(element) {
        this.component = new Vue({
            el: element,
            components: {
                LadTable
            },
            provide: {
                openmct: this.openmct,
                currentView: this
            },
            data: () => {
                return {
                    domainObject: this.domainObject,
                    objectPath: this.objectPath
                };
            },
            template: '<lad-table ref="ladTable" :domain-object="domainObject" :object-path="objectPath"></lad-table>'
        });
    }

    getViewContext() {
        if (!this.component) {
            return {};
        }

        return this.component.$refs.ladTable.getViewContext();
    }

    destroy(element) {
        this.component.$destroy();
        this.component = undefined;
    }
}
