import TableSetView from './components/LADTableSet.vue';
import LADTableSet from './LADTableSet';
import Vue from 'vue';
export default class LadTableSetView {
    constructor(openmct, domainObject, objectPath) {
        this.openmct = openmct;
        this.domainObject = domainObject;
        this.objectPath = objectPath;
        this.component = undefined;
        this.tableSet = new LADTableSet(this.domainObject, this.openmct);
    }

    show(element) {
        this.component = new Vue({
            el: element,
            components: {
                TableSetView
            },
            provide: {
                openmct: this.openmct,
                objectPath: this.objectPath,
                currentView: this,
                tableSet: this.tableSet
            },
            data: () => {
                return {
                    domainObject: this.domainObject
                };
            },
            template: '<table-set-view ref="TableSetView" :domain-object="domainObject"></table-set-view>'
        });
    }

    getViewContext() {
        if (!this.component) {
            return {};
        }

        return this.component.$refs.TableSetView.getViewContext();
    }

    destroy(element) {
        this.component.$destroy();
        this.component = undefined;
    }
}
