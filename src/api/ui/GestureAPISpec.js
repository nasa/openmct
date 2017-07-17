define([
    './GestureAPI',
    '../objects/object-utils',
],function(
    GestureAPI,
    openmct,
    objectUtils
){
    describe('The Gesture API', function () {
        var api, openmct;
        beforeEach(function () {

            gestureService = jasmine.createSpyObj('gestureService', ['attachGestures']);
            gestureService.attachGestures.andReturn(jasmine.any(Function));
            openmct = jasmine.createSpyObj('openmct', ['$injector']);
            var injector = jasmine.createSpyObj('injector', ['get']);
            injector.get.andReturn(gestureService);
            openmct.$injector.andReturn(injector);
            api = new GestureAPI(openmct, objectUtils);
            //openmct.$injector.get.andCallFake(gestureService);
        });
        it('attaches a contextmenu to an element and returns a destroy function', function () {
            var htmlElement = document.createElement('div');
            htmlElement.appendChild(document.createTextNode('test element'));
            var nChildDomainObject = jasmine.createSpyObj('nChildDomainObject', ['identifier']);
            var nParentDomainObject = jasmine.createSpyObj('nParentDomainObject', ['identifier']);
            var destroyFunc = api.contextMenu(htmlElement,nChildDomainObject,nParentDomainObject);
            expect(destroyFunc).toBeDefined();
        });
        it('attaches a infomenu to an element and returns a destroy function', function () {
            var htmlElement = document.createElement('div');
            htmlElement.appendChild(document.createTextNode('test element'));
            var nChildDomainObject = jasmine.createSpyObj('nChildDomainObject', ['identifier']);
            var nParentDomainObject = jasmine.createSpyObj('nParentDomainObject', ['identifier']);
            var destroyFunc = api.info(htmlElement,nChildDomainObject,nParentDomainObject);
            expect(destroyFunc).toBeDefined();
        });
        it('converts a new domain object to an old one and instantiates it', function () {
            var nDomainObject = jasmine.createSpyObj('nDomainObject', ['identifier']);
            var oDomainObject = api.convertAndInstantiate(nDomainObject);
            expect(oDomainObject).toBeDefined();

        });

    });
});
