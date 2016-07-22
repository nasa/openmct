define([
    './synchronizeMutationCapability'
], function (
    synchronizeMutationCapability
) {

    /**
     * Overrides certain capabilities to keep consistency between old API
     * and new API.
     */
    function APICapabilityDecorator(capabilityService) {
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

        return capabilities;
    };

    return APICapabilityDecorator;

});
