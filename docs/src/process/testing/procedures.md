# Test Procedures

## Introduction

This document is intended to be used:

* By testers, to verify that Open MCT Web behaves as specified.
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
Eval. criteria | Visual insepction

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

All requirements satisfied by Open MCT Web should be verifiable using
one or more test procedures.

## Glossary

This section will contain terms used in test procedures. This may link to
a common glossary, to avoid replication of content.

## Procedures

This section will contain specific test procedures.
