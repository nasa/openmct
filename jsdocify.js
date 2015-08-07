(function () {
    "use strict";

    var glob = require("glob"),
        split = require("split"),
        fs = require("fs"),
        stream = require("stream");

    function bundleName(file) {
        return file.substr(0, file.indexOf('/src'));
    }

    function className(file) {
        return file.substr(file.lastIndexOf('/') + 1).replace(/\.js$/, "");
    }

    function qualifiedName(file) {
        return bundleName(file) + '.' + className(file);
    }

    function spaces(count) {
        return count < 1 ? '' : (spaces(count - 1) + " ");
    }

    function jsdocRewriter(filename) {
        var rewriter = new stream.Transform(),
            reachedConstructor = false,
            inMember = false,
            starDepth = 0;

        rewriter._transform = function (chunk, encoding, done) {
            var data = String(chunk);
            if (!reachedConstructor) {
                // First, check for constructors missing @constructor
                if (data.match(/^ *\*\//) && data.indexOf("*") > 3) {
                    // Track position to detect inner methods
                    starDepth = data.indexOf("*");
                    reachedConstructor = true;
                    // Add a @memberof <namespace> annotation
                    this.push(spaces(starDepth) + "* @constructor\n");
                    this.push([
                        spaces(starDepth),
                        "* @memberof ",
                        bundleName(filename),
                        "\n"
                    ].join(""));
                } else if (data.match(/^ *\* @constructor/)) {
                    // Track position to detect inner methods
                    starDepth = data.indexOf("*");
                    reachedConstructor = true;
                    // Add a @memberof <namespace> annotation
                    this.push([
                        spaces(starDepth),
                        "* @memberof ",
                        bundleName(filename),
                        "\n"
                    ].join(""));
                }
            } else if (!inMember) {
                // Start of JSdoc for a member
                if (data.match(/^ *\/\*\*/) && data.indexOf('/') > starDepth) {
                    inMember = true;
                }
            } else {
                // End of JSdoc for a member
                if (data.match(/^ *\*\//)) {
                    this.push([
                        spaces(data.indexOf('*')),
                        "* @memberof ",
                        qualifiedName(filename),
                        "#\n"
                    ].join(""));
                    inMember = false;
                }
            }
            this.push(data + '\n');
            done();
        };

        return rewriter;
    }


    glob("platform/**/src/**/*.js", function (err, files) {
        files.forEach(function (file) {
            var tmp = file + '.tmp';
            fs.createReadStream(file, { encoding: 'utf8' })
                .pipe(split())
                .pipe(jsdocRewriter(file))
                .pipe(fs.createWriteStream(tmp, { encoding: 'utf8' }))
                .on('close', function () {
                    fs.renameSync(tmp, file);
                });
        });
    });


}());