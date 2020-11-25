export function mockLocalStorage() {
    beforeEach(() => {
        spyOn(Storage.prototype, 'getItem').and.callFake(getItem);
        spyOn(Storage.prototype, 'setItem').and.callFake(setItem);

        const store = {};

        function getItem(key) {
            return store[key];
        }

        function setItem(key, value) {
            store[key] = typeof value === 'string' ? value : JSON.stringify(value);
        }
    });
}
