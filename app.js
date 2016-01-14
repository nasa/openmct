/*global require,process,console*/

/**
 * Usage:
 *
 * npm install minimist express
 * node app.js [options]
 */

(function () {
    "use strict";

    var BUNDLE_FILE = 'bundles.json',
        options = require('minimist')(process.argv.slice(2)),
        express = require('express'),
        app = express(),
        fs = require('fs');

    // Defaults
    options.port = options.port || options.p || 8080;
    ['include', 'exclude', 'i', 'x'].forEach(function (opt) {
        options[opt] = options[opt] || [];
        // Make sure includes/excludes always end up as arrays
        options[opt] = Array.isArray(options[opt]) ?
                options[opt] : [options[opt]];
    });
    options.include = options.include.concat(options.i);
    options.exclude = options.exclude.concat(options.x);

    // Show command line options
    if (options.help || options.h) {
        console.log("\nUsage: node app.js [options]\n");
        console.log("Options:");
        console.log("  --help, -h               Show this message.");
        console.log("  --port, -p <number>      Specify port.");
        console.log("  --include, -i <bundle>   Include the specified bundle.");
        console.log("  --exclude, -x <bundle>   Exclude the specified bundle.");
        console.log("");
        process.exit(0);
    }

    // Override bundles.json for HTTP requests
    app.use('/' + BUNDLE_FILE, function (req, res) {
        var bundles;

        try {
            bundles = JSON.parse(fs.readFileSync(BUNDLE_FILE, 'utf8'));
        } catch (e) {
            bundles = [];
        }

        // Handle command line inclusions/exclusions
        bundles = bundles.concat(options.include);
        bundles = bundles.filter(function (bundle) {
            return options.exclude.indexOf(bundle) === -1;
        });
        bundles = bundles.filter(function (bundle, index) { // Uniquify
            return bundles.indexOf(bundle) === index;
        });

        res.send(JSON.stringify(bundles));
    });

    // Expose everything else as static files
    app.use(express['static']('.'));

    // Finally, open the HTTP server
    app.listen(options.port);
}());