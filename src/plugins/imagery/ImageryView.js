import ImageryViewLayout from './components/ImageryViewLayout.vue';

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
                ImageryViewLayout
            },
            provide: {
                openmct: this.openmct,
                domainObject: this.domainObject,
                objectPath: this.objectPath,
                currentView: this
            },
            template: '<imagery-view-layout ref="ImageryLayout"></imagery-view-layout>'
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
