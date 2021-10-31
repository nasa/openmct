import Vue from 'vue';
import HelloWorld from './HelloWorld.vue';
import { TypeKeyConstants } from '@/plugins/PluginConstants.js';

function SimpleVuePlugin() {
    return function install(openmct) {
        openmct.types.addType(TypeKeyConstants.HELLO_WORLD, {
            name: 'Hello World',
            description: 'An introduction object',
            creatable: true
        });
        openmct.objectViews.addProvider({
            name: "demo-provider",
            key: "hello-world",
            cssClass: "icon-packet",
            canView: function (d) {
                return d.type === 'hello-world';
            },
            view: function (domainObject) {
                var vm;

                return {
                    show: function (container) {
                        vm = new Vue(HelloWorld);
                        container.appendChild(vm.$mount().$el);
                    },
                    destroy: function (container) {
                        vm.$destroy();
                    }
                };
            }
        });

    };
}

export default SimpleVuePlugin;
