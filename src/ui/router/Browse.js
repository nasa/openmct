define([

], function (

) {

    return function install(openmct) {
        let navigateCall = 0;
        let browseObject;
        let unobserve = undefined;
        let currentObjectPath;
        let isRoutingInProgress = false;

        openmct.router.route(/^\/browse\/?$/, navigateToFirstChildOfRoot);

        openmct.router.route(/^\/browse\/(.*)$/, (path, results, params) => {
            isRoutingInProgress = true;
            let navigatePath = results[1];
            navigateToPath(navigatePath, params.view);
            onParamsChanged(null, null, params);
        });

        openmct.router.on('change:params', onParamsChanged);

        function onParamsChanged(newParams, oldParams, changed) {
            if (isRoutingInProgress) {
                return;
            }

            if (changed.view && browseObject) {
                let provider = openmct
                    .objectViews
                    .getByProviderKey(changed.view);
                viewObject(browseObject, provider);
            }
        }

        function viewObject(object, viewProvider) {
            currentObjectPath = openmct.router.path;

            openmct.layout.$refs.browseObject.show(object, viewProvider.key, true, currentObjectPath);
            openmct.layout.$refs.browseBar.domainObject = object;
            openmct.layout.$refs.browseBar.viewKey = viewProvider.key;
        }

        function navigateToPath(path, currentViewKey) {
            navigateCall++;
            let currentNavigation = navigateCall;

            if (unobserve) {
                unobserve();
                unobserve = undefined;
            }

            //Split path into object identifiers
            if (!Array.isArray(path)) {
                path = path.split('/');
            }

            return pathToObjects(path).then(objects => {
                isRoutingInProgress = false;

                if (currentNavigation !== navigateCall) {
                    return; // Prevent race.
                }

                let navigatedObject = objects[objects.length - 1];

                // FIXME: this is a hack to support create action, intended to
                // expose the current routed path.  We need to rewrite the
                // navigation service and router to expose a clear and minimal
                // API for this.
                openmct.router.path = objects.reverse();

                unobserve = openmct.objects.observe(openmct.router.path[0], '*', (newObject) => {
                    openmct.router.path[0] = newObject;
                    browseObject = newObject;
                });

                openmct.layout.$refs.browseBar.domainObject = navigatedObject;
                browseObject = navigatedObject;

                if (!navigatedObject) {
                    openmct.layout.$refs.browseObject.clear();

                    return;
                }

                let currentProvider = openmct
                    .objectViews
                    .getByProviderKey(currentViewKey);

                document.title = browseObject.name; //change document title to current object in main view

                if (currentProvider && currentProvider.canView(navigatedObject)) {
                    viewObject(navigatedObject, currentProvider);

                    return;
                }

                let defaultProvider = openmct.objectViews.get(navigatedObject)[0];
                if (defaultProvider) {
                    openmct.router.updateParams({
                        view: defaultProvider.key
                    });
                } else {
                    openmct.router.updateParams({
                        view: undefined
                    });
                    openmct.layout.$refs.browseObject.clear();
                }
            });
        }

        function pathToObjects(path) {
            return Promise.all(path.map((keyString) => {
                return openmct.objects.get(keyString);
            }));
        }

        function navigateToFirstChildOfRoot() {
            openmct.objects.get('ROOT').then(rootObject => {
                openmct.composition.get(rootObject).load()
                    .then(children => {
                        let lastChild = children[children.length - 1];
                        if (!lastChild) {
                            console.error('Unable to navigate to anything. No root objects found.');
                        } else {
                            let lastChildId = openmct.objects.makeKeyString(lastChild.identifier);
                            openmct.router.setPath(`#/browse/${lastChildId}`);
                        }
                    });
            });
        }
    };
});
