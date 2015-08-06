var htmlrunner,
    resultdir,
    page,
    fs;

var system = require('system');

if ( system.args.length !== 3 ) {
    console.log("Usage: phantom_test_runner.js HTML_RUNNER RESULT_DIR");
    phantom.exit();
} else {
    htmlrunner = system.args[1];
    resultdir = system.args[2];
    page = require("webpage").create();
    fs = require("fs");

    // Echo the output of the tests to the Standard Output, report status
    // when console runner completes.
    page.onConsoleMessage = function(msg, source, linenumber) {
        console.log(msg);
        if (msg === "ConsoleReporter finished") {
            var status = page.evaluate(function () {
                return console_reporter.status;
            });
            if (status === "success") {
                phantom.exit(0);
                console.log("Test Success");
            } else if (status === "fail") {
                phantom.exit(1);
                console.log("Test Fail");
            } else {
                phantom.exit(2);
                console.log("Unexpected test result");
            }
        }
    };

    page.open(htmlrunner, function(status) {
        if (status === "success") {
            console.log("phantomjs> Successfully loaded '" + htmlrunner + "'.");
        } else {
            console.log("phantomjs> Could not load '" + htmlrunner + "'.");
            phantom.exit(1);
        }
    });
}
