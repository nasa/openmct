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
        let isCompact = this.objectPath.find(object => object.type === 'time-strip');

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
            data() {
                return {
                    options: {
                        compact: isCompact
                    }
                };
            },
            template: '<imagery-view-layout ref="ImageryLayout" :options="options"></imagery-view-layout>'

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
