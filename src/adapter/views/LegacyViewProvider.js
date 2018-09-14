define([

], function (

) {

    function LegacyViewProvider(legacyView, openmct, convertToLegacyObject) {
        console.warn(`DEPRECATION WARNING: Migrate ${legacyView.key} from ${legacyView.bundle.path} to use the new View APIs.  Legacy view support will be removed soon.`);
        return {
            key: legacyView.key,
            name: legacyView.name,
            cssClass: legacyView.cssClass,
            description: legacyView.description,
            editable: legacyView.editable,
            canView: function (domainObject) {
                if (!domainObject || !domainObject.identifier) {
                    return false;
                }
                if (legacyView.type) {
                    return domainObject.type === legacyView.type;
                }
                let legacyObject = convertToLegacyObject(domainObject);
                if (legacyView.needs) {
                    let meetsNeeds = legacyView.needs.every(k => legacyObject.hasCapability(k));
                    if (!meetsNeeds) {
                        return false;
                    }
                }
                return openmct.$injector.get('policyService').allow(
                    'view', legacyView, legacyObject
                );
            },
            view: function (domainObject) {
                let $rootScope = openmct.$injector.get('$rootScope');
                let templateLinker = openmct.$injector.get('templateLinker');
                let scope = $rootScope.$new();
                let legacyObject = convertToLegacyObject(domainObject);
                let isDestroyed = false;
                scope.domainObject = legacyObject;
                scope.model = legacyObject.getModel();


                return {
                    show: function (container) {
                        // TODO: implement "gestures" support ?
                        let uses = legacyView.uses || [];
                        let promises = [];
                        let results = uses.map(function (capabilityKey, i) {
                            let result = legacyObject.useCapability(capabilityKey);
                            if (result.then) {
                                promises.push(result.then(function (r) {
                                    results[i] = r;
                                }));
                            }
                            return result;
                        });

                        function link() {
                            if (isDestroyed) {
                                return;
                            }
                            uses.forEach(function (key, i) {
                                scope[key] = results[i];
                            });
                            templateLinker.link(
                                scope,
                                openmct.$angular.element(container),
                                legacyView
                            );
                            container.style.height = '100%';
                        }

                        if (promises.length) {
                            Promise.all(promises)
                                .then(function () {
                                    link();
                                    scope.$digest();
                                });
                        } else {
                            link();
                        }
                    },
                    destroy: function () {
                        scope.$destroy();
                    }
                }
            }
        };
    };

    return LegacyViewProvider;

});
