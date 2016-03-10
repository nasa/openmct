// Temporary utility script to rewrite bundle.json
// files as bundle.js files.

var glob = require('glob'),
    fs = require('fs'),
    path = require('path'),
    _ = require('lodash'),
    template = _.template(
        fs.readFileSync(path.resolve(__dirname, 'rebundle-template.txt'), 'utf8')
    );

function indent(str, depth) {
    return _.trimLeft(str.split('\n').map(function (line) {
        return _.repeat('    ', depth || 1) + line;
    }).filter(function (line) {
        return line.trim().length > 0;
    }).join('\n'));
}

function findImpls(bundleContents) {
    return _(bundleContents.extensions || {})
        .map()
        .flatten()
        .pluck('implementation')
        .filter()
        .uniq()
        .value();
}

function toIdentifier(impl) {
    var parts = impl.replace(".js", "").split('/');
    return parts[parts.length - 1];
}

function toPath(impl) {
    return "\"./src/" + impl.replace(".js", "") + "\"";
}

function replaceImpls(bundleText) {
    var rx = /"implementation": "([^"]*)"/;
    return bundleText.split('\n').map(function (line) {
        var m = line.match(rx);
        return m !== null ?
                line.replace(rx, '"implementation": ' + toIdentifier(m[1])) :
                line;
    }).join('\n');
}

function rebundle(file) {
    var plainJson = fs.readFileSync(file, 'utf8'),
        bundleContents = JSON.parse(plainJson),
        impls = findImpls(bundleContents),
        bundleName = file.replace("/bundle.json", ""),
        outputFile = file.replace(".json", ".js"),
        contents = template({
            bundleName: bundleName,
            implPaths: indent(impls.map(toPath).concat([""]).join(",\n")),
            implNames: indent(impls.map(toIdentifier).concat([""]).join(",\n")),
            bundleContents: indent(replaceImpls(JSON.stringify(bundleContents, null, 4)))
        });
    fs.writeFileSync(outputFile, contents, 'utf8');
}

glob('**/bundle.json', {}, function (err, files) {
    if (err) {
        console.log(err);
        return;
    }

    files.forEach(rebundle);
});

