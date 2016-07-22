define([
    './synchronizeMutationCapability',
    './AlternateCompositionCapability'
], function (
    synchronizeMutationCapability,
    AlternateCompositionCapability
) {

    /**
     * Overrides certain capabilities to keep consistency between old API
     * and new API.
     */
    function APICapabilityDecorator($injector, capabilityService) {
        this.$injector = $injector;
        this.capabilityService = capabilityService;
    }

    APICapabilityDecorator.prototype.getCapabilities = function (
        model
    ) {
        var capabilities = this.capabilityService.getCapabilities(model);
        if (capabilities.mutation) {
            capabilities.mutation =
                synchronizeMutationCapability(capabilities.mutation);
        }
        if (AlternateCompositionCapability.appliesTo(model)) {
            capabilities.composition = function (domainObject) {
                return new AlternateCompositionCapability(this.$injector, domainObject)
            }.bind(this);
        }

        return capabilities;
    };

    return APICapabilityDecorator;

});
