import ImageryViewProvider from './ImageryViewProvider';

export default function () {
    return function install(openmct) {
        console.log(openmct);
        openmct.objectViews.addProvider(new ImageryViewProvider(openmct));
    };
}

