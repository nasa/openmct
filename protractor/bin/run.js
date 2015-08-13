#! /usr/bin/env node
var shell = require("shelljs/global");
var sleep = require('sleep');

var command = __dirname + "/../node_modules/protractor/bin/protractor " +__dirname + "/../conf.js";
console.log("Executing Protractor Test")
exec(command, function(code, output) {
    if(code != 0){
        console.log('Exit code:', code);
        console.log('Program output:', output);
    }
});