import MemoryLeaksReporter from "./src/utils/testing/MemoryLeaksReporter";

jasmine.getEnv().addReporter(new MemoryLeaksReporter());

const testsContext = require.context('.', true, /\/(src|platform)\/.*Spec.js$/);
testsContext.keys().forEach(testsContext);
