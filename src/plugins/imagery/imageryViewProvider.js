define([
    './components/imageryViewLayout.vue',
    'vue'
], function (
    ImageryViewLayoutComponent,
    Vue
) {
    function ImageryViewProvider(openmct) {
        const type = 'example.imagery';

        const hasImageTelemetry = function (domainObject) {
            var metadata = openmct.telemetry.getMetadata(domainObject);
            if (!metadata) {
                return false;
            }

            return metadata.valuesForHints(['image']).length > 0;
        };

        return {
            key: type,
            name: 'Imagery Layout',
            cssClass: 'icon-image',
            canView: function (domainObject) {
                return hasImageTelemetry(domainObject);
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
            }
        }
    }

    return ImageryViewProvider;
});
