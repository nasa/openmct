import MemoryLeaksReporter from "./src/utils/testing/MemoryLeaksReporter";

const testsContext = require.context('.', true, /\/(src|platform)\/.*Spec.js$/);

testsContext.keys().forEach(testsContext);

jasmine.getEnv().addReporter(new MemoryLeaksReporter());
