const testsContext = require.context('.', true, /\/(src|platform|\.\/example)\/.*Spec.js$/);

testsContext.keys().forEach(testsContext);
