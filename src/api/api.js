define([
    './Type',
    './TimeConductor',
    './View',
    './objects/ObjectAPI',
    './composition/CompositionAPI',
    './ui/Dialog'
], function (
    Type,
    TimeConductor,
    View,
    ObjectAPI,
    CompositionAPI,
    Dialog
) {
    return {
        Type: Type,
        View: View,
        Objects: ObjectAPI,
        Composition: CompositionAPI,
        Dialog: Dialog
    };
});
