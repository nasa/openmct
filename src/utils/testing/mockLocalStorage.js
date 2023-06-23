export function mockLocalStorage() {
  let store;

  beforeEach(() => {
    spyOn(Storage.prototype, 'getItem').and.callFake(getItem);
    spyOn(Storage.prototype, 'setItem').and.callFake(setItem);
    spyOn(Storage.prototype, 'removeItem').and.callFake(removeItem);
    spyOn(Storage.prototype, 'clear').and.callFake(clear);

    store = {};

    function getItem(key) {
      return store[key];
    }

    function setItem(key, value) {
      store[key] = typeof value === 'string' ? value : JSON.stringify(value);
    }

    function removeItem(key) {
      store[key] = undefined;
      delete store[key];
    }

    function clear() {
      store = {};
    }
  });

  afterEach(() => {
    store = undefined;
  });
}
