define([
    './components/imageryViewLayout.vue',
    'vue'
], function (
    ImageryViewLayoutComponent,
    Vue
) {
    function ImageryViewProvider(openmct) {
        const type = 'imagery-layout';

        return {
            key: type,
            name: 'ImageryLayout',
            cssClass: 'icon-image',
            canView: function (domainObject) {
                return domainObject.type === type;
            },
            view: function (domainObject) {
                let component;

                return {
                    show: function (element) {
                        component = new Vue({
                            data() {
                                return {};
                            },
                            components: {
                                ImageryViewLayoutComponent: ImageryViewLayoutComponent.default
                            },
                            provide: {
                                openmct,
                                domainObject
                            },
                            el: element,
                            template: '<imagery-view-layout-component ref="ImageryLayout"></imagery-view-layout-component>'
                        });
                    },
                    destroy: function () {
                        component.$destroy();
                        component = undefined;
                    }
                };
            },
            priority: function () {
                return 999;
            }
        }
    }

    return ImageryViewProvider;
});