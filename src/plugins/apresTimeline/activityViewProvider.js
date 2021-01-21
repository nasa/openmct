import Vue from 'vue';
import timelineComponent from './components/timelineActivity.vue';

export default class activityViewProvider {
    constructor() {
        this.name = 'activity';
        this.key = 'apres.activity.view';
        this.priority = 1;
    }

    canView(domainObject) {
        return domainObject.type === 'apres.activity.type';
    }

    canEdit(domainObject) {
        return domainObject.type === 'apres.activity.type';
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
                    template: `
                      <timeline-component
                          :isEditing="isEditing"
                       domain-object>
                      </timeline-component>`
                });
            },
            onEditModeChange: (isEditing) => {
                component.isEditing = isEditing;
            },
            destroy: () => {
                component.$destroy();
            }
        }
    }
}
