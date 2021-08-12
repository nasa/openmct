import ImageryViewLayout from './components/ImageryViewLayout.vue';
import ImageryTimeView from "./components/ImageryTimeView.vue";

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
        let template = '<imagery-view-layout ref="ImageryLayout" :options="options"></imagery-view-layout>';

        if (isCompact) {
            template = '<imagery-time-view ref="ImageryLayout" :options="options"></imagery-time-view>';
        }

        this.component = new Vue({
            el: element,
            components: {
                ImageryViewLayout,
                ImageryTimeView
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
            template
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
