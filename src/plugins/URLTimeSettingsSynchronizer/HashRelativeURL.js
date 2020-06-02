//TODO: Forget relative paths and blah blah blah. Add utility functions for Open MCT
// eg. setObjectPath, getObjectPath, getSearchParameter, setSearchParameter, deleteSearchParameter
class HashRelativeURL extends URL {
    constructor(hash) {
        super(hash.substring(1), window.location.origin);
    }
    toRelativePathString() {
        return `${this.pathname}${this.search}`;
    }
}

HashRelativeURL.fromCurrent = function () {
    return new HashRelativeURL(window.location.hash);
}

export default HashRelativeURL;
