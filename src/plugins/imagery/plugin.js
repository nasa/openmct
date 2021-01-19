import ImageryViewProvider from './ImageryViewProvider';

export default function (configuration) {
    return function install(openmct) {
        openmct.objectViews.addProvider(new ImageryViewProvider(openmct, configuration));
    };
}

