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

/*global require,__dirname*/
var gulp = require('gulp'),
    requirejsOptimize = require('gulp-requirejs-optimize'),
    sourcemaps = require('gulp-sourcemaps'),
    rename = require('gulp-rename'),
    sass = require('gulp-sass'),
    bourbon = require('node-bourbon'),
    jshint = require('gulp-jshint'),
    jscs = require('gulp-jscs'),
    replace = require('gulp-replace-task'),
    karma = require('karma'),
    path = require('path'),
    fs = require('fs'),
    git = require('git-rev-sync'),
    moment = require('moment'),
    merge = require('merge-stream'),
    project = require('./package.json'),
    _ = require('lodash'),
    paths = {
        main: 'main.js',
        dist: 'dist',
        assets: 'dist/assets',
        scss: ['./platform/**/*.scss', './example/**/*.scss'],
        scripts: [ 'main.js', 'platform/**/*.js', 'src/**/*.js' ],
        specs: [ 'platform/**/*Spec.js', 'src/**/*Spec.js' ],
        static: [
            'index.html',
            'platform/**/*',
            'example/**/*',
            'bower_components/**/*'
        ]
    },
    options = {
        requirejsOptimize: {
            name: paths.main.replace(/\.js$/, ''),
            mainConfigFile: paths.main,
            wrapShim: true
        },
        jshint: {
            "bitwise": true,
            "browser": true,
            "curly": true,
            "eqeqeq": true,
            "freeze": true,
            "funcscope": true,
            "futurehostile": true,
            "latedef": true,
            "noarg": true,
            "nocomma": true,
            "nonbsp": true,
            "nonew": true,
            "predef": [
                "define",
                "Promise"
            ],
            "strict": "implied",
            "undef": true,
            "unused": true
        },
        karma: {
            configFile: path.resolve(__dirname, 'karma.conf.js'),
            singleRun: true
        },
        sass: {
            includePaths: bourbon.includePaths
        },
        replace: {
            variables: {
                version: project.version,
                timestamp: moment.utc(Date.now()).format(),
                revision: fs.existsSync('.git') ? git.long() : 'Unknown',
                branch: fs.existsSync('.git') ? git.branch() : 'Unknown'
            }
        }
    };

gulp.task('scripts', function () {
    return gulp.src(paths.main)
        .pipe(sourcemaps.init())
        .pipe(requirejsOptimize(options.requirejsOptimize))
        .pipe(sourcemaps.write('.'))
        .pipe(replace(options.replace))
        .pipe(gulp.dest(paths.dist));
});

gulp.task('test', function (done) {
    new karma.Server(options.karma, done).start();
});

gulp.task('stylesheets', function () {
    return gulp.src(paths.scss, {base: '.'})
        .pipe(sourcemaps.init())
        .pipe(sass(options.sass).on('error', sass.logError))
        .pipe(rename(function (file) {
            file.dirname = file.dirname.replace('/sass', '/css');
            return file;
        }))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest(__dirname));
});

gulp.task('lint', function () {
    var nonspecs = paths.specs.map(function (glob) {
            return "!" + glob;
        }),
        scriptLint = gulp.src(paths.scripts.concat(nonspecs))
            .pipe(jshint(options.jshint)),
        specLint = gulp.src(paths.specs)
            .pipe(jshint(_.extend({ jasmine: true }, options.jshint)));

    return merge(scriptLint, specLint)
        .pipe(jshint.reporter('default'))
        .pipe(jshint.reporter('fail'));
});

gulp.task('checkstyle', function () {
    return gulp.src(paths.scripts)
        .pipe(jscs())
        .pipe(jscs.reporter())
        .pipe(jscs.reporter('fail'));
});

gulp.task('fixstyle', function () {
    return gulp.src(paths.scripts, { base: '.' })
        .pipe(jscs({ fix: true }))
        .pipe(gulp.dest('.'));
});

gulp.task('static', ['stylesheets'], function () {
    return gulp.src(paths.static, { base: '.' })
        .pipe(gulp.dest(paths.dist));
});

gulp.task('watch', function () {
    gulp.watch(paths.scss, ['stylesheets']);
});

gulp.task('serve', function () {
    console.log('Running development server with all defaults');
    var app = require('./app.js');
});

gulp.task('develop', ['serve', 'stylesheets', 'watch']);

gulp.task('install', [ 'static', 'scripts' ]);

gulp.task('verify', [ 'lint', 'test' ]);

gulp.task('build', [ 'verify', 'install' ]);
