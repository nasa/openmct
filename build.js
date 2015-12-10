/*global require*/
var requirejs = require("requirejs"),
    globby = require("globby"),
    fs = require("fs"),
    bundles = fs.readFileSync("bundles.json"),
    files = [];

function trimJsExtension(filename) {
    return filename.replace(".js", "");
}

JSON.parse(bundles).forEach(function (bundle) {
    files = files.concat(globby.sync(bundle + "/src/**/*.js"));
});

requirejs.optimize({
    baseUrl: ".",
    name: "main",
    out: "target/main.js",
    paths: {
        'es6-promise': 'platform/framework/lib/es6-promise-2.0.0.min',
        'moment': 'platform/telemetry/lib/moment.min',
        'moment-duration-format': 'platform/features/clock/lib/moment-duration-format',
        'uuid': 'platform/core/lib/uuid'
    },
    shim: {
        'moment-duration-format': {
            deps: [ 'moment' ]
        }
    },
    include: files.map(trimJsExtension),
    exclude: globby.sync("platform/framework/lib/**/*.js").map(trimJsExtension)
});