define([

], function (

) {

    return function install(openmct) {
        let navigateCall = 0;
        let browseObject;

        function viewObject(object, viewProvider) {
            openmct.layout.$refs.browseObject.show(object, viewProvider.key, true);
            openmct.layout.$refs.browseBar.domainObject = object;
            openmct.layout.$refs.browseBar.viewKey = viewProvider.key;
        };

        function navigateToPath(path, currentViewKey) {
            navigateCall++;
            let currentNavigation = navigateCall;

            if (!Array.isArray(path)) {
                path = path.split('/');
            }

            return Promise.all(path.map((keyString)=>{
                return openmct.objects.get(keyString);
            })).then((objects)=>{
                if (currentNavigation !== navigateCall) {
                    return; // Prevent race.
                }

                let navigatedObject = objects[objects.length - 1];

                // FIXME: this is a hack to support create action, intended to
                // expose the current routed path.  We need to rewrite the
                // navigation service and router to expose a clear and minimal
                // API for this.
                openmct.router.path = objects.reverse();

                openmct.layout.$refs.browseBar.domainObject = navigatedObject;
                browseObject = navigatedObject;
                if (!navigatedObject) {
                    openmct.layout.$refs.browseObject.clear();
                    return;
                }
                let currentProvider = openmct
                    .objectViews
                    .getByProviderKey(currentViewKey)

                if (currentProvider && currentProvider.canView(navigatedObject)) {
                    viewObject(navigatedObject,  currentProvider);
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
