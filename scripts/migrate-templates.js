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
    fs = require('fs'),
    path = require('path'),
    _ = require('lodash');

function toTemplateName(templateUrl) {
    var parts = templateUrl.split('/');
    return _.camelCase(parts[parts.length - 1].replace(".html", "")) +
            "Template";
}

function getTemplateUrl(sourceLine) {
    return _.trim(sourceLine.split(":")[1], "\", ");
}

function hasTemplateUrl(sourceLine) {
    return sourceLine.indexOf("templateUrl") !== -1;
}

function findTemplateURLs(sourceCode) {
    return sourceCode.split('\n')
        .map(_.trim)
        .filter(hasTemplateUrl)
        .map(getTemplateUrl);
}

function injectRequireArgument(sourceCode, templateUrls) {
    var lines = sourceCode.split('\n'),
        index;

    templateUrls = _.uniq(templateUrls);

    // Add arguments for source paths...
    index = lines.map(_.trim).indexOf("'legacyRegistry'");
    lines = lines.slice(0, index).concat(templateUrls.map(function (url) {
        return "    \"text!./res/" + url + "\",";
    }).concat(lines.slice(index)));

    /// ...and for arguments
    index = lines.map(_.trim).indexOf("legacyRegistry");
    lines = lines.slice(0, index).concat(templateUrls.map(function (url) {
        return "    " + toTemplateName(url) + ",";
    }).concat(lines.slice(index)));

    return lines.join('\n');
}

function rewriteUrl(sourceLine) {
    return [
        sourceLine.substring(0, sourceLine.indexOf(sourceLine.trim())),
        "\"template\": " + toTemplateName(getTemplateUrl(sourceLine)),
        _.endsWith(sourceLine, ",") ? "," : ""
    ].join('');
}

function rewriteLine(sourceLine) {
    return hasTemplateUrl(sourceLine) ?
        rewriteUrl(sourceLine.replace("templateUrl", "template")) :
        sourceLine;
}

function rewriteTemplateUrls(sourceCode) {
    return sourceCode.split('\n').map(rewriteLine).join('\n');
}

function migrate(file) {
    var sourceCode = fs.readFileSync(file, 'utf8');
    fs.writeFileSync(file, rewriteTemplateUrls(
        injectRequireArgument(sourceCode, findTemplateURLs(sourceCode))
    ), 'utf8');
}

glob('platform/**/bundle.js', {}, function (err, files) {
    if (err) {
        console.log(err);
        return;
    }

    files.forEach(migrate);
});
