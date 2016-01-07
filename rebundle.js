// Temporary utility script to rewrite bundle.json
// files as bundle.js files.

var glob = require('glob'),
    fs = require('fs'),
    header = fs.readFileSync('header.txt', 'utf8');

function indent(str) {
    return str.split('\n').map(function (line, index) {
        return index === 0 ? line : ('        ' + line);
    }).join('\n');
}

function rebundle(file) {
    var plainJson = fs.readFileSync(file, 'utf8'),
        bundleName = file.replace("/bundle.json", ""),
        outputFile = file.replace(".json", ".js"),
        contents = [
            header,
            "legacyRegistry.register(\"",
            bundleName,
            "\", ",
            indent(plainJson),
            ");\n",
            "});\n"
        ].join('');
    fs.writeFileSync(outputFile, contents, 'utf8');
}

glob('**/bundle.json', {}, function (err, files) {
    if (err) {
        console.log(err);
        return;
    }

    files.forEach(rebundle);
});

