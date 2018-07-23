/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2017, United States Government
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

/*global require,__dirname*/

require("v8-compile-cache");

var gulp = require('gulp'),
    path = require('path'),
    fs = require('fs'),
    git = require('git-rev-sync'),
    moment = require('moment'),
    project = require('./package.json'),
    _ = require('lodash'),
    paths = {
        reports: 'dist/reports',
        scripts: [ 'openmct.js', 'platform/**/*.js', 'src/**/*.js' ],
        specs: [ 'platform/**/*Spec.js', 'src/**/*Spec.js' ],
    };

gulp.task('lint', function () {
    var jshint = require('gulp-jshint');
    var merge = require('merge-stream');

    var nonspecs = paths.specs.map(function (glob) {
            return "!" + glob;
        }),
        scriptLint = gulp.src(paths.scripts.concat(nonspecs))
            .pipe(jshint()),
        specLint = gulp.src(paths.specs)
            .pipe(jshint({ jasmine: true }));

    return merge(scriptLint, specLint)
        .pipe(jshint.reporter('gulp-jshint-html-reporter', {
            filename: paths.reports + '/lint/jshint-report.html',
            createMissingFolders : true
        }))
        .pipe(jshint.reporter('default'))
        .pipe(jshint.reporter('fail'));
});

gulp.task('checkstyle', function () {
    var jscs = require('gulp-jscs');
    var mkdirp = require('mkdirp');
    var reportName = 'jscs-html-report.html';
    var reportPath = path.resolve(paths.reports, 'checkstyle', reportName);
    var moveReport = fs.rename.bind(fs, reportName, reportPath, _.noop);

    mkdirp.sync(path.resolve(paths.reports, 'checkstyle'));

    return gulp.src(paths.scripts)
        .pipe(jscs())
        .pipe(jscs.reporter())
        .pipe(jscs.reporter('jscs-html-reporter')).on('finish', moveReport)
        .pipe(jscs.reporter('fail'));
});

gulp.task('fixstyle', function () {
    var jscs = require('gulp-jscs');

    return gulp.src(paths.scripts, { base: '.' })
        .pipe(jscs({ fix: true }))
        .pipe(gulp.dest('.'));
});
