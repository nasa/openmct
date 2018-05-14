/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2018, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT is licensed under the Apache License, Version 2.0 (the
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
 * Open MCT includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/

// Converts all templateUrl references in bundle.js files to
// plain template references, loading said templates with the
// RequireJS text plugin.

var glob = require('glob'),
    fs = require('fs');

function migrate(file) {
    var sourceCode = fs.readFileSync(file, 'utf8'),
        lines = sourceCode.split('\n')
            .filter(function (line) {
                return !(/^\W*['"]use strict['"];\W*$/.test(line));
            })
            .filter(function (line) {
                return line.indexOf("/*global") !== 0;
            });
    fs.writeFileSync(file, lines.join('\n'));
}

glob('@(src|platform)/**/*.js', {}, function (err, files) {
    if (err) {
        console.log(err);
        return;
    }

    files.forEach(migrate);
});
