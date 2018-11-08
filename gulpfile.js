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
    sourcemaps = require('gulp-sourcemaps'),
    path = require('path'),
    fs = require('fs'),
    git = require('git-rev-sync'),
    moment = require('moment'),
    project = require('./package.json'),
    paths = {
        main: 'openmct.js',
        dist: 'dist',
        reports: 'dist/reports',
        scss: ['./platform/**/*.scss', './example/**/*.scss'],
        assets: [
            './{example,platform}/**/*.{css,css.map,png,svg,ico,woff,eot,ttf}'
        ],
        scripts: [ 'openmct.js', 'platform/**/*.js', 'src/**/*.js' ],
        specs: [ 'platform/**/*Spec.js', 'src/**/*Spec.js' ],
    },
    options = {
        requirejsOptimize: {
            name: 'bower_components/almond/almond.js',
            include: paths.main.replace('.js', ''),
            wrap: {
                start: (function () {
                    var buildVariables = {
                        version: project.version,
                        timestamp: moment.utc(Date.now()).format(),
                        revision: fs.existsSync('.git') ? git.long() : 'Unknown',
                        branch: fs.existsSync('.git') ? git.branch() : 'Unknown'
                    };
                    return fs.readFileSync("src/start.frag", 'utf-8')
                        .replace(/@@(\w+)/g, function (match, key) {
                            return buildVariables[key];
                        });;
                }()),
                endFile: "src/end.frag"
            },
            optimize: 'uglify2',
            uglify2: { output: { comments: /@preserve/ } },
            mainConfigFile: paths.main,
            wrapShim: true
        },
        karma: {
            configFile: path.resolve(__dirname, 'karma.conf.js'),
            singleRun: true
        },
        sass: {
            sourceComments: true
        }
    };

if (process.env.NODE_ENV === 'development') {
    options.requirejsOptimize.optimize = 'none';
}


gulp.task('scripts', function () {
    var requirejsOptimize = require('gulp-requirejs-optimize');

    return gulp.src(paths.main)
        .pipe(sourcemaps.init())
        .pipe(requirejsOptimize(options.requirejsOptimize))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest(paths.dist));
});

gulp.task('test', function (done) {
    var karma = require('karma');
    new karma.Server(options.karma, done).start();
});

gulp.task('stylesheets', function () {
    var sass = require('gulp-sass');
    var rename = require('gulp-rename');
    var bourbon = require('node-bourbon');
    options.sass.includePaths = bourbon.includePaths;

    return gulp.src(paths.scss, {base: '.'})
        .pipe(sourcemaps.init())
        .pipe(sass(options.sass).on('error', sass.logError))
        .pipe(rename(function (file) {
            file.dirname =
                file.dirname.replace(path.sep + 'sass', path.sep + 'css');
            return file;
        }))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest(__dirname));
});

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
    var moveReport = fs.rename.bind(fs, reportName, reportPath, function () {});

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

gulp.task('assets', ['stylesheets'], function () {
    return gulp.src(paths.assets)
        .pipe(gulp.dest(paths.dist));
});

gulp.task('watch', function () {
    return gulp.watch(paths.scss, ['stylesheets', 'assets']);
});

gulp.task('serve', function () {
    console.log('Running development server with all defaults');
    var app = require('./app.js');
});

gulp.task('develop', ['serve', 'stylesheets', 'watch']);

gulp.task('install', [ 'assets', 'scripts' ]);

gulp.task('verify', [ 'lint', 'test', 'checkstyle' ]);

gulp.task('build', [ 'verify', 'install' ]);
