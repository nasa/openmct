define([

], function (

) {

    // Find an object in an array of objects.
    function findObject(domainObjects, id) {
        var i;
        for (i = 0; i < domainObjects.length; i += 1) {
            if (domainObjects[i].getId() === id) {
                return domainObjects[i];
            }
        }
    }

    function getLastChildIfRoot(object) {
        if (object.getId() !== 'ROOT') {
            return object;
        }
        return object.useCapability('composition')
            .then(function (composees) {
                return composees[composees.length - 1];
            });
    }

    class MainAdapter {
        constructor(layout, openmct) {
            this.openmct = openmct;
            this.layout = layout;
            this.$injector = openmct.$injector;
            this.angular = openmct.$angular;

            this.objectService = this.$injector.get('objectService');
            this.templateLinker = this.$injector.get('templateLinker');
            this.navigationService = this.$injector.get('navigationService');
            this.$timeout = this.$injector.get('$timeout');

            // this.urlService = this.$injector.get('urlService');
            // this.$route = this.$injector.get('$route');
            // this.defaultPath = this.$injector.get('DEFAULT_PATH');
            // this.initialPath = (this.$route.current.params.ids || defaultPath).split("/"),
            // console.log('Initial path!', initialPath);

            this.templateMap = {};
            this.$injector.get('templates[]').forEach((t) => {
                this.templateMap[t.key] = this.templateMap[t.key] || t;
            });

            var $rootScope = this.$injector.get('$rootScope');
            this.scope = $rootScope.$new();


            this.run();

            this.templateLinker.link(
                this.scope,
                angular.element(layout.$refs.mainContainer),
                this.templateMap["browseObject"]
            );

            this.navigationService.addListener(o => this.navigateToObject(o));
            this.getObject('ROOT')
                .then(rootObject => {
                    this.rootObject = rootObject;
                    return getLastChildIfRoot(rootObject);
                })
                .then(o => {
                    this.navigationService.setNavigation(o, true);
                });
            // this.navigateToRoot();
        }

        run() {
            // TODO: navigate to default path.
            // TODO: listen to route service and navigate on route changes?
            // TODO: handle change to/from ?



        }

        // idsForObject(domainObject) {
        //     return this.urlService
        //         .urlForLocation("", domainObject)
        //         .replace('/', '');
        // }

        navigateToObject(object) {
            this.scope.representation = {
                selected: {
                    key: 'items'
                }
            };
            // this.scope.domainObject = this.rootObject
            this.scope.domainObject = object;
            this.scope.navigatedObject = object;
            this.templateLinker.link(
                this.scope,
                angular.element(this.layout.$refs.mainContainer),
                this.templateMap["browseObject"]
            );
            // this.scope.navigatedObject = object;
            this.scheduleDigest();
        }



        scheduleDigest() {
            this.$timeout(function () {
                // digest done!
            });
        }
        //
        // navigateToObject(desiredObject) {
        //     this.ngEl = angular.element(this.layout.$refs.mainContainer);
        //     this.scope.navigatedObject = desiredObject;
        //     this.templateLinker.link(
        //         this.scope,
        //         this.ngEl,
        //         this.templateMap["browse-object"]
        //     );
        //
        //     // $scope.navigatedObject = desiredObject;
        //     // $scope.treeModel.selectedObject = desiredObject;
        //     // currentIds = idsForObject(desiredObject);
        //     // $route.current.pathParams.ids = currentIds;
        //     // $location.path('/browse/' + currentIds);
        // }
        //
        // navigateDirectlyToModel(domainObject) {
        //     var newIds = idsForObject(domainObject);
        //     if (currentIds !== newIds) {
        //         currentIds = newIds;
        //         navigateToObject(domainObject);
        //     }
        // }
        //
        //
        //
        //
        //
        //
        // // recursively locate and return an object inside of a container
        // // via a path.  If at any point in the recursion it fails to find
        // // the next object, it will return the parent.
        // findViaComposition(containerObject, path) {
        //     var nextId = path.shift();
        //     if (!nextId) {
        //         return containerObject;
        //     }
        //     return containerObject.useCapability('composition')
        //         .then(function (composees) {
        //             var nextObject = findObject(composees, nextId);
        //             if (!nextObject) {
        //                 return containerObject;
        //             }
        //             if (!nextObject.hasCapability('composition')) {
        //                 return nextObject;
        //             }
        //             return findViaComposition(nextObject, path);
        //         });
        // }
        //
        // navigateToRoot() {
        //     this.getObject('ROOT')
        //         .then(o => this.scope.domainObject = 0);
        // }
        //
        // navigateToPath(path) {
        //     return this.getObject('ROOT')
        //         .then(root => {
        //             return this.findViaComposition(root, path);
        //         })
        //         .then(getLastChildIfRoot)
        //         .then(object => {
        //             this.navigationService.setNavigation(object);
        //         });
        // }
        //
        getObject(id) {
            return this.objectService.getObjects([id])
                .then(function (results) {
                    return results[id];
                });
        }
    }

    return MainAdapter;
});
