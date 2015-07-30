/*global exports,process*/

// conf.js
exports.config = {
    allScriptsTimeout: 500000,
    defaultTimeoutInterval: 60000,
    seleniumAddress: 'http://localhost:4444/wd/hub',
    //specs: ['StressTest.js'],
    specs: [
        'create/CreateActivity.js',
        'delete/DeleteActivity.js',
        'create/CreateActivityMode.js',
        'delete/DeleteActivityMode.js',
        'create/CreateActivityMode.js',
        'create/CreateClock.js',
        'delete/DeleteClock.js',
        'create/CreateDisplay.js',
        'delete/DeleteDisplay.js',
        'create/CreateFolder.js',
        'delete/DeleteFolder.js',
        'create/CreateTelemetry.js',
        'delete/DeleteTelemetry.js',
        'create/CreateTimeline.js',
        'delete/DeleteTimeline.js',
        'create/CreateTimer.js',
        'delete/DeleteTimer.js',
        'create/CreateWebPage.js',
        'delete/DeleteWebPage.js',
        'UI/Fullscreen.js',
        'create/CreateButton.js',
        "UI/DragDrop.js",
        "UI/NewWindow.js",
        'UI/InfoBubble.js'
    ],
    capabilities: {
        'browserName': 'chrome', // or 'safari'
        'chromeOptions': {}
    }
};

// Allow specifying binary location as an environment variable,
// for cases where Chrome is not installed in a usual location.
if (process.env.PROTRACTOR_CHROME_BINARY) {
    exports.config.capabilities.chromeOptions.binary =
        process.env.PROTRACTOR_CHROME_BINARY;
}
