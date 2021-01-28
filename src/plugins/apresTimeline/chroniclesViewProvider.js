import Vue from 'vue';
import timelineComponent from './components/timelineActivity.vue';

export default class activityViewProvider {
    constructor() {
        this.name = 'chronicle';
        this.key = 'apres.chronicle.view';
        this.priority = 1;
    }

    canView(domainObject) {
        return domainObject.type === 'apres.chronicle.type';
    }

    canEdit(domainObject) {
        return domainObject.type === 'apres.chronicle.type';
    }

    view(domainObject, objectPath, isEditing) {
        let component;

        return {
            show: (element) => {
                component = new Vue({
                    el: element,
                    components: {
                        timelineComponent: timelineComponent
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
