(function () {
    const scriptObserver = new MutationObserver(handler);

    function handler(mutationsList, observer) {
        for (let mutation of mutationsList) {
            if (mutation.type === 'childList') {
                Array.from (mutation.addedNodes)
                    .filter (node => node.tagName === 'SCRIPT')
                    .forEach (script => {
                        script.addEventListener ('load', () => {
                            if (script.src.includes('openmct.js')) {
                                const openmct = window.openmct;
                                openmct.install(openmct.plugins.RestrictedNotebook('CUSTOM_NAME'));

                                scriptObserver.unobserve();
                            }
                        });
                    });
            }
        }
    }

    scriptObserver.observe(document, {
        attributes: false,
        childList: true,
        subtree: true
    });

}());
