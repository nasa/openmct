/*global require,process,GLOBAL*/
/*jslint nomen: true*/


var CONSTANTS = {
        DIAGRAM_WIDTH: 800,
        DIAGRAM_HEIGHT: 500
    };

GLOBAL.window = GLOBAL.window ||  GLOBAL; // nomnoml expects window to be defined
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
            if (!isBuilding) {
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
                    counter += 1;
                } else {
                    // Otherwise, pass through
                    this.push(chunk + '\n');
                }
            } else {
                if (chunk.trim() === "```") {
                    // End nomnoml
                    renderNomnoml(source, outputPath);
                    isBuilding = false;
                } else {
                    source += chunk + '\n';
                }
            }
            done();
        };

        return transform;
    }

    function gfmifier() {
        var transform = new stream.Transform({ objectMode: true }),
            markdown = "";
        transform._transform = function (chunk, encoding, done) {
            markdown += chunk;
            done();
        };
        transform._flush = function (done) {
            this.push("<html><body>\n");
            this.push(showdown.parse(markdown));
            this.push("\n</body></html>\n");
            done();
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

    // Also copy over all HTML files
    glob(options['in'] + "/**/*.html", {}, function (err, files) {
        files.forEach(function (file) {
            var destination = file.replace(options['in'], options.out),
                destPath = path.dirname(destination);

            mkdirp(destPath, function (err) {
                fs.createReadStream(file, { encoding: 'utf8' })
                    .pipe(fs.createWriteStream(destination, {
                        encoding: 'utf8'
                    }));
            });
        });
    });

}());
