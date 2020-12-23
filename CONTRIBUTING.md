# Contributing to Open MCT

This document describes the process of contributing to Open MCT as well
as the standards that will be applied when evaluating contributions.

Please be aware that additional agreements will be necessary before we can
accept changes from external contributors.

## Summary

The short version:

1. Write your contribution.
2. Make sure your contribution meets code, test, and commit message
   standards as described below.
3. Submit a pull request from a topic branch back to `master`. Include a check
   list, as described below. (Optionally, assign this to a specific member
   for review.)
4. Respond to any discussion. When the reviewer decides it's ready, they
   will merge back `master` and fill out their own check list.

## Contribution Process

Open MCT uses git for software version control, and for branching and
merging. The central repository is at
https://github.com/nasa/openmct.git.

### Roles

References to roles are made throughout this document. These are not intended
to reflect titles or long-term job assignments; rather, these are used as
descriptors to refer to members of the development team performing tasks in
the check-in process. These roles are:

* _Author_: The individual who has made changes to files in the software
  repository, and wishes to check these in.
* _Reviewer_: The individual who reviews changes to files before they are
  checked in.
* _Integrator_: The individual who performs the task of merging these files.
  Usually the reviewer.

### Branching

Three basic types of branches may be included in the above repository:

1. Master branch
2. Topic branches
3. Developer branches

Branches which do not fit into the above categories may be created and used
during the course of development for various reasons, such as large-scale
refactoring of code or implementation of complex features which may cause
instability. In these exceptional cases it is the responsibility of the
developer who initiates the task which motivated this branching to
communicate to the team the role of these branches and any associated
procedures for the duration of their use.

#### Master Branch

The role of the `master` branches is to represent the latest
"ready for test" version of the software. Source code on the master
branch has undergone peer review, and will undergo regular automated
testing with notification on failure. Master branches may be unstable
(particularly for recent features), but the intent is for the stability of
any features on master branches to be non-decreasing. It is the shared
responsibility of authors, reviewers, and integrators to ensure this.

#### Topic Branches

Topic branches are used by developers to perform and record work on issues.

Topic branches need not necessarily be stable, even when pushed to the
central repository; in fact, the practice of making incremental commits
while working on an issue and pushing these to the central repository is
encouraged, to avoid lost work and to share work-in-progress. (Small commits
also help isolate changes, which can help in identifying which change
introduced a defect, particularly when that defect went unnoticed for some
time, e.g. using `git bisect`.)

Topic branches should be named according to their corresponding issue
identifiers, all lower case, without hyphens. (e.g. branch mct9 would refer
to issue #9.)

In some cases, work on an issue may warrant the use of multiple divergent
branches; for instance, when a developer wants to try more than one solution
and compare them, or when a "dead end" is reached and an initial approach to
resolving an issue needs to be abandoned. In these cases, a short suffix
should be added to the additional branches; this may be simply a single
character (e.g. wtd481b) or, where useful, a descriptive term for what
distinguishes the branches (e.g. wtd481verbose). It is the responsibility of
the author to communicate which branch is intended to be merged to both the
reviewer and the integrator.

#### Developer Branches

Developer branches are any branches used for purposes outside of the scope
of the above; e.g. to try things out, or maintain a "my latest stuff"
branch that is not delayed by the review and integration process. These
may be pushed to the central repository, and may follow any naming convention
desired so long as the owner of the branch is identifiable, and so long as
the name chosen could not be mistaken for a topic or master branch.

### Merging

When development is complete on an issue, the first step toward merging it
back into the master branch is to file a Pull Request (PR). The contributions
should meet code, test, and commit message standards as described below,
and the pull request should include a completed author checklist, also
as described below. Pull requests may be assigned to specific team
members when appropriate (e.g. to draw to a specific person's attention).

Code review should take place using discussion features within the pull
request. When the reviewer is satisfied, they should add a comment to
the pull request containing the reviewer checklist (from below) and complete
the merge back to the master branch.

Additionally:
* Every pull request must link to the issue that it addresses. Eg. “Addresses #1234” or “Closes #1234”. This is the responsibility of the pull request’s __author__. If no issue exists, create one.
* Every __author__ must include testing instructions. These instructions should identify the areas of code affected, and some minimal test steps. If addressing a bug, reproduction steps should be included, if they were not included in the original issue. If reproduction steps were included on the original issue, and are sufficient, refer to them.
* A pull request that closes an issue should say so in the description. Including the text “Closes #1234” will cause the linked issue to be automatically closed when the pull request is merged. This is the responsibility of the pull request’s __author__.
* When a pull request is merged, and the corresponding issue closed, the __reviewer__ must add the tag “unverified” to the original issue. This will indicate that although the issue is closed, it has not been tested yet.
* Every PR must have two reviewers assigned, though only one approval is necessary for merge.
* Changes to API require approval by a senior developer.
* When creating a PR, it is the author's responsibility to apply any priority label from the issue to the PR as well. This helps with prioritization.

## Standards

Contributions to Open MCT are expected to meet the following standards.
In addition, reviewers should use general discretion before accepting
changes.

### Code Standards

JavaScript sources in Open MCT must satisfy the ESLint rules defined in 
this repository. This is verified by the command line build.

#### Code Guidelines

The following guidelines are provided for anyone contributing source code to the Open MCT project:

1. Write clean code. Here’s a good summary - https://github.com/ryanmcdermott/clean-code-javascript.
1. Include JSDoc for any exposed API (e.g. public methods, classes).
1. Include non-JSDoc comments as-needed for explaining private variables,
   methods, or algorithms when they are non-obvious. Otherwise code 
   should be self-documenting.
1. Classes and Vue components should use camel case, first letter capitalized
   (e.g. SomeClassName).
1. Methods, variables, fields, events, and function names should use camelCase,
   first letter lower-case (e.g. someVariableName).
1. Source files that export functions should use camelCase, first letter lower-case (eg. testTools.js)
1. Constants (variables or fields which are meant to be declared and 
   initialized statically, and never changed) should use only capital 
   letters, with underscores between words (e.g. SOME_CONSTANT). They should always be declared as `const`s
1. File names should be the name of the exported class, plus a .js extension
   (e.g. SomeClassName.js).
1. Avoid anonymous functions, except when functions are short (one or two lines)
   and their inclusion makes sense within the flow of the code
   (e.g. as arguments to a forEach call). Anonymous functions should always be arrow functions.
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
1. Avoid deep nesting (especially of functions), except where necessary
   (e.g. due to closure scope).
1. End with a single new-line character.
1. Always use ES6 `Class`es and inheritence rather than the pre-ES6 prototypal 
   pattern.
1. Within a given function's scope, do not mix declarations and imperative
   code, and  present these in the following order:
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
1. Test specs should reside alongside the source code they test, not in a separate directory.
1. Organize code by feature, not by type.
   eg.
   ```
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
   ```
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
Deviations from Open MCT code style guidelines require two-party agreement,
typically from the author of the change and its reviewer.

### Test Standards

Automated testing shall occur whenever changes are merged into the main
development branch and must be confirmed alongside any pull request.

Automated tests are tests which exercise plugins, API, and utility classes. 
Tests are subject to code review along with the actual implementation, to 
ensure that tests are applicable and useful.

Examples of useful tests:
* Tests which replicate bugs (or their root causes) to verify their
  resolution.
* Tests which reflect details from software specifications.
* Tests which exercise edge or corner cases among inputs.
* Tests which verify expected interactions with other components in the
  system.

#### Guidelines
* 100% statement coverage is achievable and desirable.
* Do blackbox testing. Test external behaviors, not internal details. Write tests that describe what your plugin is supposed to do. How it does this doesn't matter, so don't test it.
* Unit test specs for plugins should be defined at the plugin level. Start with one test spec per plugin named pluginSpec.js, and as this test spec grows too big, break it up into multiple test specs that logically group related tests.
* Unit tests for API or for utility functions and classes may be defined at a per-source file level.
* Wherever possible only use and mock public API, builtin functions, and UI in your test specs. Do not directly invoke any private functions. ie. only call or mock functions and objects exposed by openmct.* (eg. openmct.telemetry, openmct.objectView, etc.), and builtin browser functions (fetch, requestAnimationFrame, setTimeout, etc.).
* Where builtin functions have been mocked, be sure to clear them between tests.
* Test at an appropriate level of isolation. Eg. 
    * If you’re testing a view, you do not need to test the whole application UI, you can just fetch the view provider using the public API and render the view into an element that you have created. 
    * You do not need to test that the view switcher works, there should be separate tests for that. 
    * You do not need to test that telemetry providers work, you can mock openmct.telemetry.request() to feed test data to the view.
    * Use your best judgement when deciding on appropriate scope.
* Automated tests for plugins should start by actually installing the plugin being tested, and then test that installing the plugin adds the desired features and behavior to Open MCT, observing the above rules.
* All variables used in a test spec, including any instances of the Open MCT API should be declared inside of an appropriate block scope (not at the root level of the source file), and should be initialized in the relevant beforeEach block. `beforeEach` is preferable to `beforeAll` to avoid leaking of state between tests.
* A `afterEach` or `afterAll` should be used to do any clean up necessary to prevent leakage of state between test specs. This can happen when functions on `window` are wrapped, or when the URL is changed. [A convenience function](https://github.com/nasa/openmct/blob/master/src/utils/testing.js#L59) is provided for resetting the URL and clearing builtin spies between tests.
* If writing unit tests for legacy Angular code be sure to follow [best practices in order to avoid memory leaks](https://www.thecodecampus.de/blog/avoid-memory-leaks-angularjs-unit-tests/).

#### Examples
* [Example of an automated test spec for an object view plugin](https://github.com/nasa/openmct/blob/master/src/plugins/telemetryTable/pluginSpec.js)
* [Example of an automated test spec for API](https://github.com/nasa/openmct/blob/master/src/api/time/TimeAPISpec.js)

### Commit Message Standards

Commit messages should:

* Contain a one-line subject, followed by one line of white space,
  followed by one or more descriptive paragraphs, each separated by one
￼￼￼￼￼  line of white space.
* Contain a short (usually one word) reference to the feature or subsystem
  the commit effects, in square brackets, at the start of the subject line
  (e.g. `[Documentation] Draft of check-in process`).
* Contain a reference to a relevant issue number in the body of the commit.
  * This is important for traceability; while branch names also provide this,
    you cannot tell from looking at a commit what branch it was authored on.
  * This may be omitted if the relevant issue is otherwise obvious from the
    commit history (that is, if using `git log` from the relevant commit
    directly leads to a similar issue reference) to minimize clutter.
* Describe the change that was made, and any useful rationale therefore.
  * Comments in code should explain what things do, commit messages describe
    how they came to be done that way.
* Provide sufficient information for a reviewer to understand the changes
  made and their relationship to previous code.

Commit messages should not:

* Exceed 54 characters in length on the subject line.
* Exceed 72 characters in length in the body of the commit,
  * Except where necessary to maintain the structure of machine-readable or
    machine-generated text (e.g. error messages).

See [Contributing to a Project](http://git-scm.com/book/ch5-2.html) from
Pro Git by Shawn Chacon and Ben Straub for a bit of the rationale behind
these standards.

## Issue Reporting

Issues are tracked at https://github.com/nasa/openmct/issues.

Issues should include:

* A short description of the issue encountered.
* A longer-form description of the issue encountered. When possible, steps to
  reproduce the issue.
* When possible, a description of the impact of the issue. What use case does
  it impede?
* An assessment of the severity of the issue.

Issue severity is categorized as follows (in ascending order):

* _Trivial_: Minimal impact on the usefulness and functionality of the
  software; a "nice-to-have."
* _(Unspecified)_: Major loss of functionality or impairment of use.
* _Critical_: Large-scale loss of functionality or impairment of use,
  such that remaining utility becomes marginal.
* _Blocker_: Harmful or otherwise unacceptable behavior. Must fix.

## Check Lists

The following check lists should be completed and attached to pull requests
when they are filed (author checklist) and when they are merged (reviewer
checklist).

### Author Checklist

1. Changes address original issue?
2. Unit tests included and/or updated with changes?
3. Command line build passes?
4. Changes have been smoke-tested?
5. Testing instructions included?

### Reviewer Checklist

1. Changes appear to address issue?
2. Appropriate unit tests included?
3. Code style and in-line documentation are appropriate?
4. Commit messages meet standards?
5. Has associated issue been labelled `unverified`? (only applicable if this PR closes the issue)
