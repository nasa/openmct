import ImageryViewProvider from './ImageryViewProvider';

export default function () {
    return function install(openmct) {
        openmct.objectViews.addProvider(new ImageryViewProvider(openmct));
    };
}

