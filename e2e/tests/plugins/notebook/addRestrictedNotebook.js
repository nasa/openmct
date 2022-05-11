import { CUSTOM_NAME } from './constants';

(function () {
    document.addEventListener('DOMContentLoaded', () => {
        const openmct = window.openmct;

        openmct.install(openmct.plugins.RestrictedNotebook(CUSTOM_NAME));
    });
}());
