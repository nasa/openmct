define([], function () {
    function AdapterCompositionPolicy(mct) {
        this.mct = mct;
    }

    AdapterCompositionPolicy.prototype.allow = function (
        containerType,
        childType
    ) {
        var containerObject = containerType.getInitialModel();
        var childObject = childType.getInitialModel();

        containerObject.type = containerType.getKey();
        childObject.type = childType.getKey();

        var composition = this.mct.Composition(containerObject);

        if (composition) {
            return composition.canContain(childObject);
        }

        return true;
    };

    return AdapterCompositionPolicy;
});
