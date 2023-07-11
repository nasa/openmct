# Contributing to Open MCT

This document describes the process of contributing to Open MCT as well
as the standards that will be applied when evaluating contributions.

Please be aware that additional agreements will be necessary before we can
accept changes from external contributors.

## Summary

The short version:

1. Write your contribution or describe your idea in the form of a [GitHub issue](https://github.com/nasa/openmct/issues/new/choose) or [start a GitHub discussion](https://github.com/nasa/openmct/discussions).
2. Make sure your contribution meets code, test, and commit message
   standards as described below.
3. Submit a pull request from a topic branch back to `master`. Include a check
   list, as described below. (Optionally, assign this to a specific member
   for review.)
4. Respond to any discussion. When the reviewer decides it's ready, they
   will merge back `master` and fill out their own check list.
5. If you are a first-time contributor, please see [this discussion](https://github.com/nasa/openmct/discussions/3821) for further information.

## Contribution Process

Open MCT uses git for software version control, and for branching and
merging. The central repository is at
<https://github.com/nasa/openmct.git>.

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

* Every pull request must link to the issue that it addresses. Eg. “Addresses #1234” or “Closes #1234”. This is the responsibility of the pull request’s __author__. If no issue exists, [create one](https://github.com/nasa/openmct/issues/new/choose).
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

JavaScript sources in Open MCT must satisfy the [ESLint](https://eslint.org/) rules defined in
this repository. [Prettier](https://prettier.io/) is used in conjunction with ESLint to enforce code style
via automated formatting. These are verified by the command line build.

#### Code Guidelines

The following guidelines are provided for anyone contributing source code to the Open MCT project:

1. Write clean code. Here’s a good summary - <https://github.com/ryanmcdermott/clean-code-javascript>.
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
1. Always use ES6 `Class`es and inheritance rather than the pre-ES6 prototypal
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

Deviations from Open MCT code style guidelines require two-party agreement,
typically from the author of the change and its reviewer.

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

Issues are tracked at <https://github.com/nasa/openmct/issues>.

Issue severity is categorized as follows (in ascending order):

* _Trivial_: Minimal impact on the usefulness and functionality of the software; a "nice-to-have." Visual impact without functional impact,
* _Medium_: Some impairment of use, but simple workarounds exist
* _Critical_: Significant loss of functionality or impairment of use. Display of telemetry data is not affected though. Complex workarounds exist.
* _Blocker_: Major functionality is impaired or lost, threatening mission success. Display of telemetry data is impaired or blocked by the bug, which could lead to loss of situational awareness.

## Check Lists

The following check lists should be completed and attached to pull requests
when they are filed (author checklist) and when they are merged (reviewer
checklist).

[Within PR Template](.github/PULL_REQUEST_TEMPLATE.md)
