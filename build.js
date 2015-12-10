/*****************************************************************************
 * Open MCT Web, Copyright (c) 2014-2015, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT Web is licensed under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 *
 * Open MCT Web includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/

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