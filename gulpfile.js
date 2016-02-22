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
    compass = require('gulp-compass'),
    jshint = require('gulp-jshint'),
    jscs = require('gulp-jscs'),
    replace = require('gulp-replace-task'),
    karma = require('karma'),
    path = require('path'),
    fs = require('fs'),
    git = require('git-rev-sync'),
    moment = require('moment'),
    project = require('./package.json'),
    paths = {
        main: 'main.js',
        dist: 'dist',
        assets: 'dist/assets',
        scss: 'platform/**/*.scss',
        scripts: [ 'main.js', 'platform/**/*.js', 'src/**/*.js' ],
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
        karma: {
            configFile: path.resolve(__dirname, 'karma.conf.js'),
            singleRun: true
        },
        compass: {
            sass: __dirname,
            css: paths.assets,
            sourcemap: true
        },
        replace: {
            variables: {
                version: project.version,
                timestamp: moment.utc(Date.now()).format(),
                revision: fs.existsSync('.git') ? git.long() : 'Unknown',
                branch: fs.existsSync('.git') ? git.branch() : 'Unknown'
            }
        }
    },
    stream = require('stream'),
    compassWrapper = new stream.Transform({objectMode: true});

/* Transform stream that allows us to transform individual files */
compassWrapper._transform = function (chunk, encoding, done) {
    if (/\/_[^\/]*.scss$/.test(chunk.path)) {
        return done();
    }
    var baseDir = 'platform/' + chunk.relative.replace(/sass\/.*$/, ''),
        options = {
            project: __dirname,
            sass: baseDir + 'sass/',
            css: baseDir + 'css/',
            comments: true,
            bundle_exec: true
        };

    compass(options).on('data', function (file) {
        done(null, file);
    }).on('error', function (error) {
        done(error);
    })
    .end(chunk);
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

gulp.task('compass');

gulp.task('stylesheets', function () {
    return gulp.src(paths.scss)
        .pipe(compassWrapper);
});

gulp.task('lint', function () {
    return gulp.src(paths.scripts)
        .pipe(jshint())
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

gulp.task('develop', ['serve', 'watch']);

gulp.task('install', [ 'static', 'scripts' ]);

gulp.task('verify', [ 'lint', 'test' ]);

gulp.task('build', [ 'verify', 'install' ]);
