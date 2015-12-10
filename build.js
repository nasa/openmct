/*global require*/
var requirejs = require("requirejs"),
    globby = require("globby"),
    stripHtmlComments = require("strip-html-comments"),
    fs = require("fs"),
    bundles = fs.readFileSync("bundles.json", 'utf8'),
    scripts = [],
    templates = [],
    contents,
    index = fs.readFileSync("index.html", 'utf8');

function trimJsExtension(filename) {
    return filename.replace(/\.js$/, "");
}

JSON.parse(bundles).forEach(function (bundle) {
    scripts = scripts.concat(globby.sync(bundle + "/src/**/*.js"));
    templates = templates.concat(globby.sync(bundle + "/res/**/*.html"));
});

contents = templates.map(function (template) {
    var contents = fs.readFileSync(template, 'utf8');
    // Strip comments
    contents = contents.replace(/<!--[\s\S]*?-->/g, "");
    return [
        "<script type=\"text/ng-template\" ",
        "id=\"" + template + "\">",
        contents,
        "</script>"
    ].join('');
}).join('\n');

fs.writeFileSync(
    'target/index.html',
    index.replace("</body>", contents + "</body>"),
    'utf8'
);

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
    include: scripts.map(trimJsExtension),
    exclude: globby.sync("platform/framework/lib/**/*.js").map(trimJsExtension)
});