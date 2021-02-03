import Vue from 'vue';

export default class  timeZoneViewProvider {
    constructor() {
        this.name = 'timeZone';
        this.key = 'apres.timeZone.view';
        this.priority = 1;
    }

    canView(domainObject) {
        return domainObject.type === 'apres.timeZone.type';
    }

    canEdit(domainObject) {
        return domainObject.type === 'apres.timeZone.type';
    }

    view(domainObject, objectPath, isEditing) {
        let component;

        return {
            show: (element) => {
                component = new Vue({
                    el: element,
                    components: {
                    },
                    data() {
                        return {
                            isEditing: isEditing
                        }
                    },
                    provide: {
                        openmct,
                        domainObject,
                        objectPath
                    },
                });
            },
            destroy: () => {
                component.$destroy();
            }
        }
    }
}
