define([

], function () {
    function ObjectAPI(objectService) {
        window.MCT = window.MCT || {};
        window.MCT.objects = objectService;
    }

    return ObjectAPI;
});
