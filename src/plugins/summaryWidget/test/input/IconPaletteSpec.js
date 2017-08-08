define(['../../src/input/IconPalette'], function (IconPalette) {
    describe('An Open MCT icon palette', function () {
        var iconPalette, changeCallback;

        beforeEach(function () {
            changeCallback = jasmine.createSpy('changeCallback');
        })

        it('allows defining a custom icon set', function () {
            iconPalette = new IconPalette('someProperty', 'someClass', ['icon1', 'icon2', 'icon3']);
            expect(iconPalette.getCurrent()).toEqual('icon1');
            iconPalette.on('change', changeCallback);
            iconPalette.set('icon2');
            expect(iconPalette.getCurrent()).toEqual('icon2');
            expect(changeCallback).toHaveBeenCalledWith('icon2', 'someProperty');
        });

        it('loads with a default icon set if one is not provided', function () {
            iconPalette = new IconPalette('someProperty', 'someClass')
            expect(iconPalette.getCurrent()).toBeDefined();
        })
    });
});
