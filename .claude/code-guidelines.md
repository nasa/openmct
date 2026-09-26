#### Code Guidelines

The following guidelines are provided for anyone contributing source code to the Open MCT project:

1. Write clean code. Here’s a good summary - <https://github.com/ryanmcdermott/clean-code-javascript>.
1. Include JSDoc for any exposed API (e.g. public methods, classes).
1. Include non-JSDoc comments as-needed for explaining private variables, methods, or algorithms when they are non-obvious. Otherwise code should be self-documenting.
1. Classes and Vue components should use camel case, first letter capitalized (e.g. SomeClassName).
1. Methods, variables, fields, events, and function names should use camelCase, first letter lower-case (e.g. someVariableName).
1. Source files that export functions should use camelCase, first letter lower-case (eg. testTools.js)
1. Constants (variables or fields which are meant to be declared and initialized statically, and never changed) should use only capital letters, with underscores between words (e.g. SOME_CONSTANT). They should always be declared as `const`s
1. File names should be the name of the exported class, plus a .js extension (e.g. SomeClassName.js).
1. Avoid anonymous functions, except when functions are short (one or two lines) and their inclusion makes sense within the flow of the code (e.g. as arguments to a forEach call). Anonymous functions should always be arrow functions.
1. Named functions are preferred over functions assigned to variables.
   eg.

   ```JavaScript
   function renameObject(object, newName) {
       Object.name = newName;
   }
   ```

   is preferable to

   ```JavaScript
   const rename = (object, newName) => {
       Object.name = newName;
   }
   ```

1. Avoid deep nesting (especially of functions), except where necessary (e.g. due to closure scope).
1. End with a single new-line character.
1. Always use ES6 `Class`es and inheritance rather than the pre-ES6 prototypal pattern.
1. Within a given function's scope, do not mix declarations and imperative code, and  present these in the following order:
   * First, variable declarations and initialization.
   * Secondly, imperative statements.
   * Finally, the returned value. A single return statement at the end of the function should be used, except where an early return would improve code clarity.
1. Avoid the use of "magic" values.
   eg.

   ```JavaScript
   const UNAUTHORIZED = 401;
   if (responseCode === UNAUTHORIZED)
   ```

   is preferable to

   ```JavaScript
   if (responseCode === 401)
   ```

1. Use the ternary operator only for simple cases such as variable assignment. Nested ternaries should be avoided in all cases.
1. Unit Test specs should reside alongside the source code they test, not in a separate directory.
1. Organize code by feature, not by type.
   eg.

   ```txt
   - telemetryTable
       - row
           TableRow.js
           TableRowCollection.js
           TableRow.vue
       - column
           TableColumn.js
           TableColumn.vue
       plugin.js
       pluginSpec.js
   ```

   is preferable to

   ```txt
   - telemetryTable
       - components
           TableRow.vue
           TableColumn.vue
       - collections
           TableRowCollection.js
       TableColumn.js
       TableRow.js
       plugin.js
       pluginSpec.js
   ```

Deviations from Open MCT code style guidelines require two-party agreement, typically from the author of the change and its reviewer.

### Commit Message Standards

Commit messages should:

* Contain a one-line subject, followed by one line of white space, followed by one or more descriptive paragraphs, each separated by one line of white space.
* Contain a short (usually one word) reference to the feature or subsystem the commit effects, in square brackets, at the start of the subject line (e.g. `[Documentation] Draft of check-in process`).
* Contain a reference to a relevant issue number in the body of the commit.
  * This is important for traceability; while branch names also provide this, you cannot tell from looking at a commit what branch it was authored on.
  * This may be omitted if the relevant issue is otherwise obvious from the commit history (that is, if using `git log` from the relevant commit directly leads to a similar issue reference) to minimize clutter.
* Describe the change that was made, and any useful rationale therefore.
  * Comments in code should explain what things do, commit messages describe how they came to be done that way.
* Provide sufficient information for a reviewer to understand the changes made and their relationship to previous code.

Commit messages should not:

* Exceed 54 characters in length on the subject line.
* Exceed 72 characters in length in the body of the commit,
  * Except where necessary to maintain the structure of machine-readable or machine-generated text (e.g. error messages).

See [Contributing to a Project](http://git-scm.com/book/ch5-2.html) from Pro Git by Shawn Chacon and Ben Straub for a bit of the rationale behind these standards.