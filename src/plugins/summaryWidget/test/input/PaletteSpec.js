define(['../../src/input/Palette'], function (Palette) {
  describe('A generic Open MCT palette input', function () {
    let palette;
    let callbackSpy1;
    let callbackSpy2;

    beforeEach(function () {
      palette = new Palette('someClass', 'someContainer', ['item1', 'item2', 'item3']);
      callbackSpy1 = jasmine.createSpy('changeCallback1');
      callbackSpy2 = jasmine.createSpy('changeCallback2');
    });

    it('gets the current item', function () {
      expect(palette.getCurrent()).toEqual('item1');
    });

    it('allows setting the current item', function () {
      palette.set('item2');
      expect(palette.getCurrent()).toEqual('item2');
    });

    it('allows registering change callbacks, and errors when an unsupported event is registered', function () {
      expect(function () {
        palette.on('change', callbackSpy1);
      }).not.toThrow();
      expect(function () {
        palette.on('someUnsupportedEvent', callbackSpy1);
      }).toThrow();
    });

    it('injects its callbacks with the new selected item on change', function () {
      palette.on('change', callbackSpy1);
      palette.on('change', callbackSpy2);
      palette.set('item2');
      expect(callbackSpy1).toHaveBeenCalledWith('item2');
      expect(callbackSpy2).toHaveBeenCalledWith('item2');
    });

    it('gracefully handles being set to an item not included in its set', function () {
      palette.set('foobar');
      expect(palette.getCurrent()).not.toEqual('foobar');
    });
  });
});
