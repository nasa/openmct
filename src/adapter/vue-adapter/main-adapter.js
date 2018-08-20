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

    // recursively locate and return an object inside of a container
    // via a path.  If at any point in the recursion it fails to find
    // the next object, it will return the parent.
    function findViaComposition(containerObject, path) {
        var nextId = path.shift();
        if (!nextId) {
            return containerObject;
        }
        return containerObject.useCapability('composition')
            .then(function (composees) {
                var nextObject = findObject(composees, nextId);
                if (!nextObject) {
                    return containerObject;
                }
                if (!nextObject.hasCapability('composition')) {
                    return nextObject;
                }
                return findViaComposition(nextObject, path);
            });
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

    function pathForObject(domainObject) {
        var context = domainObject.getCapability('context'),
            objectPath = context ? context.getPath() : [],
            ids = objectPath.map(function (domainObj) {
                return domainObj.getId();
            });
        return  "/browse/" + ids.slice(1).join("/");
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

            this.templateMap = {};
            this.$injector.get('templates[]').forEach((t) => {
                this.templateMap[t.key] = this.templateMap[t.key] || t;
            });

            var $rootScope = this.$injector.get('$rootScope');
            this.scope = $rootScope.$new();
            this.scope.representation = {};

            openmct.router.route(/^\/browse\/(.*)$/, (path, results) => {
                let navigatePath = results[1];
                if (!navigatePath) {
                    navigatePath = 'mine';
                }
                this.navigateToPath(navigatePath);
            });

            this.navigationService.addListener(o => this.navigateToObject(o));
        }

        navigateToPath(path) {
            if (!Array.isArray(path)) {
                path = path.split('/');
            }
            return this.getObject('ROOT')
                .then(root => {
                    return findViaComposition(root, path);
                })
                .then(getLastChildIfRoot)
                .then(object => {
                    this.setMainViewObject(object);
                });
        }

        setMainViewObject(object) {
            this.scope.domainObject = object;
            this.scope.navigatedObject = object;
            this.templateLinker.link(
                this.scope,
                angular.element(this.layout.$refs.mainContainer),
                this.templateMap["browseObject"]
            );
            document.title = object.getModel().name;
            this.scheduleDigest();
        }

        idsForObject(domainObject) {
            return this.urlService
                .urlForLocation("", domainObject)
                .replace('/', '');
        }

        navigateToObject(object) {
            let path = pathForObject(object);
            let views = object.useCapability('view');
            let params = this.openmct.router.getParams();
            let currentViewIsValid = views.some(v => v.key === params['view']);
            if (!currentViewIsValid) {
                this.scope.representation = {
                    selected: views[0]
                }
                this.openmct.router.update(path, {
                    view: views[0].key
                });
            } else {
                this.openmct.router.setPath(path);
            }
        }

        scheduleDigest() {
            this.$timeout(function () {
                // digest done!
            });
        }

        getObject(id) {
            return this.objectService.getObjects([id])
                .then(function (results) {
                    return results[id];
                });
        }
    }

    return MainAdapter;
});
