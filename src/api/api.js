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
        View: View,
        Objects: ObjectAPI,
        Composition: CompositionAPI
    };
});
