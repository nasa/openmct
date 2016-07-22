define([

], function (

) {

    /**
     * Wraps the mutation capability and synchronizes the mutation
     */
    function synchronizeMutationCapability(mutationConstructor) {

        return function makeCapability(domainObject) {
            var capability = mutationConstructor(domainObject);
            var oldListen = capability.listen.bind(capability);
            capability.listen = function (listener) {
                return oldListen(function (newModel) {
                    capability.domainObject.model =
                        JSON.parse(JSON.stringify(newModel));
                    listener(newModel);
                });
            };
            return capability;
        }
    };

    return synchronizeMutationCapability;
});
