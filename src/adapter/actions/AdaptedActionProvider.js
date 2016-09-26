define([], function () {
    // Adapts old-timey actions to the new-fangled way.
    function AdaptedActionProvider(legacyActionService) {
        this.legacyActionService = legacyActionService;
    }

    AdaptedActionProvider.prototype.get = function (context) {
        var legacyContext = {};

        legacyContext.domainObject =

    };

    return AdaptedActionProvider;
});
