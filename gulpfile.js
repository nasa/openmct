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
    karma = require('karma'),
    path = require('path'),
    paths = {
        main: 'main.js',
        dist: 'dist',
        assets: 'dist/assets',
        scss: 'platform/**/*.scss'
    },
    options = {
        requirejsOptimize: {
            name: paths.main.replace(/\.js$/, ''),
            mainConfigFile: paths.main
        },
        karma: {
            configFile: path.resolve(__dirname, 'karma.conf.js'),
            singleRun: true
        },
        compass: {
            sass: __dirname,
            css: paths.assets
        }
    };

gulp.task('scripts', function () {
    return gulp.src(paths.main)
        .pipe(sourcemaps.init())
        .pipe(requirejsOptimize(options.requirejsOptimize))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest(paths.dist));
});

gulp.task('test', function (done) {
    new karma.Server(options.karma, done).start();
});

gulp.task('stylesheets', function () {
    return gulp.src(paths.scss)
        .pipe(compass(options.compass))
        .pipe(gulp.dest(paths.assets));
});
