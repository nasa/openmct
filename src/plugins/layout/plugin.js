import layout from './Layout.vue'
import Vue from 'vue'
import objectUtils from '../../api/objects/object-utils.js'

export default function () {
    return function (openmct) {
        console.log("Installing Layout component...");

        openmct.objectViews.addProvider({
            key: 'layout.view',
            canView: function (domainObject) {
                return domainObject.type === 'layout';
            },
            view: function (domainObject) {
                let component;
                return {
                    show(container) {
                        component = new Vue({
                            components: {
                                layout
                            },
                            template: '<layout :domain-object="domainObject"></layout>',
                            provide: {
                                openmct,
                                objectUtils
                            },
                            el: container,
                            data () {
                                return {
                                    domainObject: domainObject
                                }
                            }                            
                        });
                    },
                    destroy() {
                        component.$destroy();
                    }
                };
            },
            priority() {
                return 1;
            }
        });
    }
}