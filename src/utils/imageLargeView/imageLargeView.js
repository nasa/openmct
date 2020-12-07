import Vue from 'vue';

import ImageLargeView from './imageLargeView.html';

export function openInImageLargeView(openmct, imageSrc, imageMeta = {}) {
    const DEFAULT_FILTERS = {
        brightness: 100,
        contrast: 100
    };

    const alt = imageMeta.alt || 'missing image';
    const filters = imageMeta.filters || DEFAULT_FILTERS;
    const style = `filter: brightness(${filters.brightness}%) contrast(${filters.contrast}%)`;
    const element = new Vue({
        data: () => {
            return {
                alt,
                imageSrc,
                time: imageMeta.time,
                style
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
