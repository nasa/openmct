const testsContext = require.context('.', true, /\/(src|platform)\/.*Spec.js$/);

testsContext.keys().forEach(testsContext);
