define([

], function (

) {

    return function install(openmct) {
        let navigateCall = 0;
        let browseObject;


        function viewObject(object, viewProvider) {
            openmct.layout.$refs.browseObject.show(object, viewProvider.key);
            openmct.layout.$refs.browseBar.domainObject = object;
            openmct.layout.$refs.browseBar.viewKey = viewProvider.key;
        };

        function navigateToPath(path, currentViewKey) {
            navigateCall++;
            let currentNavigation = navigateCall;

            if (!Array.isArray(path)) {
                path = path.split('/');
            }
            let keyString = path[path.length - 1];
            // TODO: retain complete path in navigation.
            return openmct.objects.get(keyString)
                .then((object) => {
                    if (currentNavigation !== navigateCall) {
                        return; // Prevent race.
                    }
                    openmct.layout.$refs.browseBar.domainObject = object;
                    browseObject = object;
                    if (!object) {
                        openmct.layout.$refs.browseObject.clear();
                        return;
                    }
                    let currentProvider = openmct
                        .objectViews
                        .getByProviderKey(currentViewKey)

                    if (currentProvider && currentProvider.canView(object)) {
                        viewObject(object,  currentProvider);
                        return;
                    }

                    let defaultProvider = openmct.objectViews.get(object)[0];
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

        openmct.router.route(/^\/browse\/(.*)$/, (path, results, params) => {
            let navigatePath = results[1];
            if (!navigatePath) {
                navigatePath = 'mine';
            }
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

    }

});
