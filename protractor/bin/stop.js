#! /usr/bin/env node

var shell = require("shelljs/global");
var ps = require('psnode');
var S = require('string');
var sleep = require('sleep');
 
// A simple pid lookup 
ps.list(function(err, results) {
 
  results.forEach(function( process ){
          //Killing Node
          if(S(process.command).contains("node app.js")) {
              console.log();
              console.log( 'Killing Node: %s', process.command);
              ps.kill(process.pid, function(err, stdout) {
                  if (err) {
                      throw new Error(err);
                  }
                  console.log(stdout);
              });
          }else if(S(process.command).contains("webdriver")) {
              console.log();
              console.log( 'Killing WebDriver: %s', process.command);
              ps.kill(process.pid, function(err, stdout) {
                  if (err){
                      throw new Error(err);
                  }
                  console.log(stdout);
              });
          }else if(S(process.command).contains("protractor")) {
              console.log();
              console.log( 'Killing Chrome Drive: %s', process.command);
              ps.kill(process.pid, function(err, stdout) {
                  if (err){
                      throw new Error(err);
                  }
                  console.log(stdout);
              });
          }
      });
});


