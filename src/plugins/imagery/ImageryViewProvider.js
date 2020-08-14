import ImageryViewLayout from './components/ImageryViewLayout.vue';
import Vue from 'vue';

export default function ImageryViewProvider(openmct) {
    const type = 'example.imagery';

    function hasImageTelemetry(domainObject) {
        const metadata = openmct.telemetry.getMetadata(domainObject);
        if (!metadata) {
            return false;
        }

        return metadata.valuesForHints(['image']).length > 0;
    }

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
                        el: element,
                        components: {
                            ImageryViewLayout
                        },
                        provide: {
                            openmct,
                            domainObject
                        },
                        template: '<imagery-view-layout ref="ImageryLayout"></imagery-view-layout>'
                    });
                },
                destroy: function () {
                    component.$destroy();
                    component = undefined;
                }
            };
        }
    };
}
