#! /usr/bin/env node

var shell = require("shelljs/global");
var ps = require('psnode');
var S = require('string');
 
// A simple pid lookup 
ps.list(function(err, results) {
 
  results.forEach(function( process ){
          //Killing Node
          if((process.command.indexOf("node app.js")) != -1) {
              console.log();
              console.log( 'Killing Node: %s', process.command);
              ps.kill(process.pid, function(err, stdout) {
              if (err) {
                 throw new Error(err);
              }
              console.log(stdout);
              });
          }
          if((process.command.indexOf("webdriver")) != -1) {
              console.log();
              console.log( 'Killing WebDriver: %s', process.command);
              ps.kill(process.pid, function(err, stdout) {
              if (err){
                  throw new Error(err);
              }
              console.log(stdout);
              });
          }
          if((process.command.indexOf("protractor")) != -1) {
              console.log();
              console.log( 'Killing Protractor Driver: %s', process.command);
              ps.kill(process.pid, function(err, stdout) {
              if (err){
                  throw new Error(err);
              }
              console.log(stdout);
              });
          }
      });
});


