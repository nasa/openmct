define([
    './Type',
    './TimeConductor',
    './View',
    './objects/ObjectAPI'
], function (
    Type,
    TimeConductor,
    View,
    ObjectAPI
) {
    return {
        Type: Type,
        TimeConductor: new TimeConductor(),
        Objects: ObjectAPI,
        View: View
    };
});
