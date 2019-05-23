define([

], function (

) {

    return function install(openmct) {
        let navigateCall = 0;
        let browseObject;

        openmct.router.route(/^\/browse\/?$/, navigateToFirstChildOfRoot);

        openmct.router.route(/^\/browse\/(.*)$/, (path, results, params) => {
            let navigatePath = results[1];
            navigateToPath(navigatePath, params.view);
        });

        openmct.router.on('change:params', function (newParams, oldParams, changed) {
            if (changed.view && browseObject) {
                let provider = openmct
                    .objectViews
                    .getByProviderKey(changed.view);
                viewObject(browseObject, provider);
            }
        });

        function viewObject(object, viewProvider) {
            openmct.layout.$refs.browseObject.show(object, viewProvider.key, true);
            openmct.layout.$refs.browseBar.domainObject = object;
            openmct.layout.$refs.browseBar.viewKey = viewProvider.key;
        }

        function navigateToPath(path, currentViewKey) {
            navigateCall++;
            let currentNavigation = navigateCall;

            if (browseObject) {
                browseObject.$destroy();
            }

            //Split path into object identifiers
            if (!Array.isArray(path)) {
                path = path.split('/');
            }

            return pathToObjects(path).then((objects)=>{
                if (currentNavigation !== navigateCall) {
                    return; // Prevent race.
                }
                // FIXME: this is a hack to support create action, intended to
                // expose the current routed path.  We need to rewrite the
                // navigation service and router to expose a clear and minimal
                // API for this.
                objects = objects.reverse();
                openmct.router.path = objects;
                objects[0] = openmct.objects.getMutable(objects[0]);

                browseObject = objects[0];
                openmct.layout.$refs.browseBar.domainObject = browseObject;

                if (!browseObject) {
                    openmct.layout.$refs.browseObject.clear();
                    return;
                }
                let currentProvider = openmct
                    .objectViews
                    .getByProviderKey(currentViewKey);

                document.title = browseObject.name; //change document title to current object in main view

                if (currentProvider && currentProvider.canView(browseObject)) {
                    viewObject(browseObject,  currentProvider);
                    return;
                }

                let defaultProvider = openmct.objectViews.get(browseObject)[0];
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
            return Promise.all(path.map((keyString)=>{
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
    }
});
