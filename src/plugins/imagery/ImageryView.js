import ImageryViewComponent from './components/ImageryView.vue';

import Vue from 'vue';

export default class ImageryView {
    constructor(openmct, domainObject, objectPath) {
        this.openmct = openmct;
        this.domainObject = domainObject;
        this.objectPath = objectPath;
        this.component = undefined;
    }

    show(element) {
        this.component = new Vue({
            el: element,
            components: {
                'imagery-view': ImageryViewComponent
            },
            provide: {
                openmct: this.openmct,
                domainObject: this.domainObject,
                objectPath: this.objectPath,
                currentView: this
            },
            template: '<imagery-view ref="ImageryContainer"></imagery-view>'

        });
    }

    destroy() {
        this.component.$destroy();
        this.component = undefined;
    }

    _getInstance() {
        return this.component;
    }
}
