import Vue from 'vue';

import ImageLargeView from './imageLargeView.html';

export function openInImageLargeView(openmct, imageSrc, imageMeta) {
    const DEFAULT_FILTERS = {
        brightness: 100,
        contrast: 100
    };
    const filters = imageMeta
        ? imageMeta.filters
        : DEFAULT_FILTERS;

    const filter = `filter: brightness(${filters.brightness}%) contrast(${filters.contrast}%)`;
    const element = new Vue({
        data: () => {
            return {
                imageSrc,
                time: imageMeta.time,
                filter
            };
        },
        template: ImageLargeView
    }).$mount();

    openmct.overlays.overlay({
        element: element.$el,
        onDestroy: () => element.$destroy(true),
        size: 'large',
        dismissable: true
    });
}
