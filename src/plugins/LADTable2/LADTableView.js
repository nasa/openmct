import TableView from '/src/plugins/telemetryTable/components/table.vue';
// import TableView from './LADTable.vue';
import LADTable from './LADTable.js';
import Vue from 'vue';
export default class LADTableView {
    constructor(openmct, domainObject, objectPath) {
        this.openmct = openmct;
        this.objectPath = objectPath;
        this.component = undefined;
        this.table = new LADTable(domainObject, openmct);
    }

    show(element) {
        this.component = new Vue({
            el: element,
            components: {
                TableView
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
            template: '<table-view ref="tableView" :marking="marking" :domain-object="domainObject"></table-view>'
        });
    }

    getViewContext() {
        if (!this.component) {
            return {};
        }

        return this.component.$refs.tableView.getViewContext();
    }

    destroy(element) {
        this.component.$destroy();
        this.component = undefined;
    }
}
