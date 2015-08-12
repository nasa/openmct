#! /usr/bin/env node
var shell,sleep;
try {
    shell = require("shelljs/global");
    sleep = require('sleep');
}catch (e){
    console.log("Dependencies Error");
    console.log("Run npm install");
    throw (e);
}
///Users/jsanderf/git/elastic/wtd/protractor/bin
var startdir = process.cwd();
var command;
mkdir(__dirname + '/../logs');

command = __dirname + "/../node_modules/protractor/bin/webdriver-manager update";
console.log("Installing Webdriver");
exec(command,{async:false});
sleep.sleep(1); 

console.log();
cd(__dirname + '/../../');
console.log('Installing Dependencies');
exec("npm install minimist express", {async:false});
console.log('Starting Node');
sleep.sleep(1);
exec("node app.js -p 1984 -x example/persistence -x platform/persistence/elastic -i example/localstorage > protractor/logs/nodeApp.log 2>&1 &", {async:false});
console.log('   Started Node');

console.log();
console.log('Starting Webdriver');
sleep.sleep(1);
exec("protractor/node_modules/protractor/bin/webdriver-manager start --standalone> protractor/logs/webdriver.log 2>&1 &",{async:false});
if(error() == null){
        console.log("   Webdriver Started");
}else{
    console.log("   Error : ", error());
}
sleep.sleep(1);
cd(startdir);
