import LadTable from '/src/plugins/telemetryTable/components/table.vue';
import TelemetryTable from '/src/plugins/telemetryTable/TelemetryTable.js';
import Vue from 'vue';

export default class LADTableView extends TelemetryTable {
    constructor(openmct, domainObject, objectPath) {
        super(domainObject, openmct);
        this.objectPath = objectPath;
        this.component = undefined;
        this.table = new TelemetryTable(domainObject, openmct);
    }

    show(element) {
        this.component = new Vue({
            el: element,
            components: {
                LadTable
            },
            provide: {
                openmct: this.openmct,
                currentView: this,
                table: this.table,
                objectPath: this.objectPath
            },
            data: () => {
                return {
                    domainObject: this.domainObject,
                    marking: {
                        disableMultiSelect: false,
                        enable: true,
                        rowName: '',
                        rowNamePlural: '',
                        useAlternateControlBar: false
                    }
                };
            },
            template: '<lad-table ref="ladTable" :marking="marking" :domain-object="domainObject"></lad-table>'
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
