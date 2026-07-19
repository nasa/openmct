const testsContext = require.context('.', true, /^\.\/(src|example)\/.*Spec.js$/);
testsContext.keys().forEach(testsContext);
