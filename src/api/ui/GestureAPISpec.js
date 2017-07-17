define([
    './GestureAPI',
    'openmct',
    '../object/object-utils'
],function(
    GestureAPI,
    openmct,
    objectUtils
){
    describe('The Gesture API', function () {
        var api;
        beforeEach(function () {
            api = new GestureAPI(openmct,objectUtils);
        });
        it('attaches a contextmenu to an element and returns a destroy function', function () {
            var htmlElement = document.createElement('div');
            htmlElement.appendChild(document.createTextNode('test element'));
        });
        it('attaches a infomenu to an element and returns a destroy function', function () {

        });

    });
});
