/*global require,process,GLOBAL*/
/*jslint nomen: true*/


var CONSTANTS = {
        DIAGRAM_WIDTH: 800,
        DIAGRAM_HEIGHT: 500
    };

GLOBAL.window = GLOBAL.window || {}; // nomnoml expects window to be defined
(function () {
    "use strict";

    var fs = require("fs"),
        mkdirp = require("mkdirp"),
        path = require("path"),
        glob = require("glob"),
        showdown = require("github-flavored-markdown"),
        split = require("split"),
        stream = require("stream"),
        nomnoml = require('nomnoml'),
        Canvas = require('canvas'),
        options = require("minimist")(process.argv.slice(2));

    function renderNomnoml(source, target) {
        var canvas =
            new Canvas(CONSTANTS.DIAGRAM_WIDTH, CONSTANTS.DIAGRAM_HEIGHT);
        nomnoml.draw(canvas, source, 1.0);
        canvas.pngStream().pipe(fs.createWriteStream(target));
    }

    function nomnomlifier(outputDirectory, prefix) {
        var transform = new stream.Transform({ objectMode: true }),
            isBuilding = false,
            counter = 1,
            outputPath,
            source = "";

        transform._transform = function (chunk, encoding, done) {
            if (isBuilding) {
                if (chunk.trim().indexOf("```nomnoml") === 0) {
                    var outputFilename = prefix + '-' + counter + '.png';
                    outputPath = path.join(outputDirectory, outputFilename);
                    this.push([
                        "\n![Diagram ",
                        counter,
                        "](",
                        outputFilename,
                        ")\n\n"
                    ].join(""));
                    isBuilding = true;
                    source = "";
                } else {
                    // Otherwise, pass through
                    this.push(chunk);
                }
            } else {
                if (chunk.trim() === "```") {
                    // End nomnoml
                    renderNomnoml(source, outputPath);
                    isBuilding = false;
                } else {
                    source += chunk;
                }
            }
        };

        return transform;
    }

    function concat() {

    }

    function gfmifier() {
        var transform = new stream.Transform({ objectMode: true }),
            markdown = "";
        transform._transform = function (chunk, encoding, done) {
            markdown += chunk;
        };
        transform._flush = function () {
            this.push(markdown);
        };
        return transform;
    }

    options['in'] = options['in'] || options.i;
    options.out = options.out || options.o;

    glob(options['in'] + "/**/*.md", {}, function (err, files) {
        files.forEach(function (file) {
            var destination = file.replace(options['in'], options.out)
                .replace(/md$/, "html"),
                destPath = path.dirname(destination),
                prefix = path.basename(destination).replace(/\.html$/, "");

            mkdirp(destPath, function (err) {
                fs.createReadStream(file, { encoding: 'utf8' })
                    .pipe(split())
                    .pipe(nomnomlifier(destPath, prefix))
                    .pipe(gfmifier())
                    .pipe(fs.createWriteStream(destination, {
                        encoding: 'utf8'
                    }));
            });
        });
    });

}());
