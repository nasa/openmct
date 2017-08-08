define(['../../src/input/ColorPalette'], function (ColorPalette) {
    describe('An Open MCT color palette', function () {
        var colorPalette, changeCallback;

        beforeEach(function () {
            changeCallback = jasmine.createSpy('changeCallback');
        })

        it('allows defining a custom color set', function () {
            colorPalette = new ColorPalette('someProperty', 'someClass', ['color1', 'color2', 'color3']);
            expect(colorPalette.getCurrent()).toEqual('color1');
            colorPalette.on('change', changeCallback);
            colorPalette.set('color2');
            expect(colorPalette.getCurrent()).toEqual('color2');
            expect(changeCallback).toHaveBeenCalledWith('color2', 'someProperty');
        });

        it('loads with a default color set if one is not provided', function () {
            colorPalette = new ColorPalette('someProperty', 'someClass')
            expect(colorPalette.getCurrent()).toBeDefined();
        })
    });
});
