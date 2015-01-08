/*global define*/

/**
 * Constants used by the framework layer.
 */
define({
    MODULE_NAME: "OpenMCTWeb",
    BUNDLE_LISTING_FILE: "bundles.json",
    BUNDLE_FILE: "bundle.json",
    SEPARATOR: "/",
    EXTENSION_SUFFIX: "[]",
    DEFAULT_BUNDLE: {
        "sources": "src",
        "resources": "res",
        "libraries": "lib",
        "tests": "test",
        "configuration": {},
        "extensions": {}
    },
    PRIORITY_LEVELS: {
        "fallback": Number.NEGATIVE_INFINITY,
        "default": 100,
        "optional": 200,
        "preferred": 400,
        "mandatory": Number.POSITIVE_INFINITY
    },
    DEFAULT_PRIORITY: 0
});