# Test Procedures

## Introduction

This document is intended to be used:

* By testers, to verify that Open MCT behaves as specified.
* By the development team, to document new test cases and to provide
  guidance on how to author these.

## Writing Procedures

### Template

Procedures for individual tests should use the following template,
adapted from [https://swehb.nasa.gov/display/7150/SWE-114]().

Property       | Value
---------------|---------------------------------------------------------------
Test ID        |
Relevant reqs. |
Prerequisites  |
Test input     |
Instructions   |
Expectation    |
Eval. criteria |

For multi-line descriptions, use an asterisk or similar indicator to refer
to a longer-form description below.

#### Example Procedure - Edit a Layout

Property       | Value
---------------|---------------------------------------------------------------
Test ID        | MCT-TEST-000X - Edit a layout
Relevant reqs. | MCT-EDIT-000Y
Prerequisites  | Create a layout, as in MCT-TEST-000Z
Test input     | Domain object database XYZ
Instructions   | See below &ast;
Expectation    | Change to editing context &dagger;
Eval. criteria | Visual inspection

&ast; Follow the following steps:

1. Verify that the created layout is currently navigated-to,
   as in MCT-TEST-00ZZ.
2. Click the Edit button, identified by a pencil icon and the text "Edit"
   displayed on hover.

&dagger; Right-hand viewing area should be surrounded by a dashed
blue border when a domain object is being edited.

### Guidelines

Test procedures should be written assuming minimal prior knowledge of the
application: Non-standard terms should only be used when they are documented
in [the glossary](#glossary), and shorthands used for user actions should
be accompanied by useful references to test procedures describing those
actions (when available) or descriptions in user documentation.

Test cases should be narrow in scope; if a list of steps is excessively
long (or must be written vaguely to be kept short) it should be broken
down into multiple tests which reference one another.

All requirements satisfied by Open MCT should be verifiable using
one or more test procedures.

## Glossary

This section will contain terms used in test procedures. This may link to
a common glossary, to avoid replication of content.

## Procedures

This section will contain specific test procedures. Presently, procedures
are placeholders describing general patterns for setting up and conducting
testing.

### User Testing Setup

These procedures describes a general pattern for setting up for user
testing. Specific deployments should customize this pattern with
relevant data and any additional steps necessary.

Property       | Value
---------------|---------------------------------------------------------------
Test ID        | MCT-TEST-SETUP0 - User Testing Setup
Relevant reqs. | TBD
Prerequisites  | Build of relevant components
Test input     | Exemplary database; exemplary telemetry data set
Instructions   | See below
Expectation    | Able to load application in a web browser (Google Chrome)
Eval. criteria | Visual inspection

Instructions:

1. Start telemetry server.
2. Start ElasticSearch.
3. Restore database snapshot to ElasticSearch.
4. Start telemetry playback.
5. Start HTTP server for client sources.

### User Test Procedures

Specific user test cases have not yet been authored. In their absence,
user testing is conducted by:

* Reviewing the text of issues from the issue tracker to understand the
  desired behavior, and exercising this behavior in the running application.
  (For instance, by following steps to reproduce from the original issue.)
  * Issues which appear to be resolved should be marked as such with comments
    on the original issue (e.g. "verified during user testing MM/DD/YYYY".)
  * Issues which appear not to have been resolved should be reopened with an
    explanation of what unexpected behavior has been observed.
  * In cases where an issue appears resolved as-worded but other related
    undesirable behavior is observed during testing, a new issue should be
    opened, and linked to from a comment in the original issues.
* General usage of new features and/or existing features which have undergone
  recent changes. Defects or problems with usability should be documented
  by filing issues in the issue tracker.
* Open-ended testing to discover defects, identify usability issues, and
  generate feature requests.

### Long-Duration Testing

The purpose of long-duration testing is to identify performance issues
and/or other defects which are sensitive to the amount of time the
application is kept running. (Memory leaks, for instance.)

Property       | Value
---------------|---------------------------------------------------------------
Test ID        | MCT-TEST-LDT0 - Long-duration Testing
Relevant reqs. | TBD
Prerequisites  | MCT-TEST-SETUP0
Test input     | (As for test setup.)
Instructions   | See "Instructions" below &ast;
Expectation    | See "Expectations" below &dagger;
Eval. criteria | Visual inspection

&ast; Instructions:

1. Start `top` or a similar tool to measure CPU usage and memory utilization.
2. Open several user-created displays (as many as would be realistically
   opened during actual usage in a stressing case) in some combination of
   separate tabs and windows (approximately as many tabs-per-window as
   total windows.)
3. Ensure that playback data is set to run continuously for at least 24 hours
   (e.g. on a loop.)
4. Record CPU usage and memory utilization.
5. In at least one tab, try some general user interface gestures and make
   notes about the subjective experience of using the application. (Particularly,
   the degree of responsiveness.)
6. Leave client displays open for 24 hours.
7. Record CPU usage and memory utilization again.
8. Make additional notes about the subjective experience of using the
   application (again, particularly responsiveness.)
9. Check logs for any unexpected warnings or errors.

&dagger; Expectations:

* At the end of the test, CPU usage and memory usage should both be similar
  to their levels at the start of the test.
* At the end of the test, subjective usage of the application should not
  be observably different from the way it was at the start of the test.
  (In particular, responsiveness should not decrease.)
* Logs should not contain any unexpected warnings or errors ("expected"
  warnings or errors are those that have been documented and prioritized
  as known issues, or those that are explained by transient conditions
  external to the software, such as network outages.)
