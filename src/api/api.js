define([
    './Type',
    './TimeConductor',
    './View',
    './objects/ObjectAPI',
    './composition/CompositionAPI'
], function (
    Type,
    TimeConductor,
    View,
    ObjectAPI,
    CompositionAPI
) {
    return {
        Type: Type,
        TimeConductor: new TimeConductor(),
        View: View,
        Objects: ObjectAPI,
        Composition: CompositionAPI
    };
});
