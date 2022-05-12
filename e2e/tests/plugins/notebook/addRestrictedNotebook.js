(function () {
    document.addEventListener('DOMContentLoaded', () => {
        const openmct = window.openmct;
        openmct.install(openmct.plugins.RestrictedNotebook('Custom Name'));
    });
}());
