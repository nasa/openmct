#! /usr/bin/env node
var shell = require("shelljs/global");

var startdir = process.cwd();
var command = "npm unlink";

console.log("Cleaning Directory")
exec(command, function(code, output) {
    if(code != 0){
        console.log('Exit code:', code);
        console.log('Program output:', output);
    }
});
console.log("rm -rf node_modules")
rm('-rf', __dirname + "/../node_modules")
