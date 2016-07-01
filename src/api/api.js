define([
    './Type',
    './View',
    './objects/ObjectAPI'
], function (
    Type,
    View,
    ObjectAPI
) {
    return {
        Type: Type,
        View: View,
        Objects: ObjectAPI
    };
});
