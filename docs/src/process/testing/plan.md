# Test Plan

## Test Levels

Testing for Open MCT includes:

* _Smoke testing_: Brief, informal testing to verify that no major issues
  or regressions are present in the software, or in specific features of
  the software.
* _Unit testing_: Automated verification of the performance of individual
  software components.
* _User testing_: Testing with a representative user base to verify
  that application behaves usably and as specified.
* _Long-duration testing_: Testing which takes place over a long period
  of time to detect issues which are not readily noticeable during
  shorter test periods.

### Smoke Testing

Manual, non-rigorous testing of the software and/or specific features
of interest. Verifies that the software runs and that basic functionality
is present. The outcome of Smoke Testing should be a simplified list of Acceptance Tests which could be executed by another team member with sufficient context.

### Unit Testing

Unit tests are automated tests which exercise individual software
components. Tests are subject to code review along with the actual
implementation, to ensure that tests are applicable and useful.

Unit tests should meet
[test standards](https://github.com/nasa/openmctweb/blob/master/CONTRIBUTING.md#test-standards)
as described in the contributing guide.

### User Testing

User testing is performed at scheduled times involving target users
of the software or reasonable representatives, along with members of
the development team exercising known use cases. Users test the
software directly; the software should be configured as similarly to
its planned production configuration as is feasible without introducing
other risks (e.g. damage to data in a production instance.)

User testing will focus on the following activities:

* Verifying issues resolved since the last test session.
* Checking for regressions in areas related to recent changes.
* Using major or important features of the software,
  as determined by the user.
* General "trying to break things."

During user testing, users will
[report issues](https://github.com/nasa/openmct/issues/new/choose)
as they are encountered.

Desired outcomes of user testing are:

* Identified software defects.
* Areas for usability improvement.
* Feature requests (particularly missed requirements.)
* Recorded issue verification.

### Long-duration Testing

Long-duration testing occurs over a twenty-four hour period. The
software is run in one or more stressing cases representative of expected
usage. After twenty-four hours, the software is evaluated for:

* Performance metrics: Have memory usage or CPU utilization increased
  during this time period in unexpected or undesirable ways?
* Subjective usability: Does the software behave in the same way it did
  at the start of the test? Is it as responsive?

Any defects or unexpected behavior identified during testing should be
[reported as issues](https://github.com/nasa/openmct/issues/new/choose)
and reviewed for severity.

## Test Performance

Tests are performed at various levels of frequency.

* _Per-merge_: Performed before any new changes are integrated into
  the software.
* _Per-sprint_: Performed at the end of every [sprint](../cycle.md).
* _Per-release_: Performed at the end of every [release](../cycle.md).

### Per-merge Testing

Before changes are merged, the author of the changes must perform:

* _Smoke testing_ (both generally, and for areas which interact with
  the new changes.)
* _Unit testing_ (as part of the automated build step.)

Changes are not merged until the author has affirmed that both
forms of testing have been performed successfully; this is documented
by the [Author Checklist](https://github.com/nasa/openmctweb/blob/master/CONTRIBUTING.md#author-checklist).

### Per-sprint Testing

Before a sprint is closed, the development team must additionally
perform:

* A relevant subset of [_user testing_](procedures.md#user-test-procedures)
  identified by the acting [project manager](../cycle.md#roles).
* [_Long-duration testing_](procedures.md#long-duration-testing)
  (specifically, for 24 hours.)

Issues are reported as a product of both forms of testing.

A sprint is not closed until both categories have been performed on
the latest snapshot of the software, _and_ no issues labelled as
["blocker"](https://github.com/nasa/openmctweb/blob/master/CONTRIBUTING.md#issue-reporting)
remain open.

### Per-release Testing

As [per-sprint testing](#per-sprint-testing), except that _user testing_
should cover all test cases, with less focus on changes from the specific
sprint or release.

Per-release testing should also include any acceptance testing steps
agreed upon with recipients of the software.

A release is not closed until both categories have been performed on
the latest snapshot of the software, _and_ no issues labelled as
["blocker" or "critical"](https://github.com/nasa/openmctweb/blob/master/CONTRIBUTING.md#issue-reporting)
remain open.

### Testathons
Testathons can be used as a means of performing per-sprint and per-release testing. 

#### Timing
For per-sprint testing, a testathon is typically performed at the beginning of the third week of a sprint, and again later that week to verify any fixes. For per-release testing, a testathon is typically performed prior to any formal testing processes that are applicable to that release.

#### Process

1. Prior to the scheduled testathon, a list will be compiled of all issues that are closed and unverified.
2. For each issue, testers should review the associated PR for testing instructions. See the contributing guide for instructions on [pull requests](https://github.com/nasa/openmct/blob/master/CONTRIBUTING.md#merging).
3. As each issue is verified via testing, any team members testing it should leave a comment on that issue indicating that it has been verified fixed.
4. If a bug is found that relates to an issue being tested, notes should be included on the associated issue, and the issue should be reopened. Bug notes should include reproduction steps.
5. For any bugs that are not obviously related to any of the issues under test, a new issue should be created with details about the bug, including reproduction steps. If unsure about whether a bug relates to an issue being tested, just create a new issue.
6. At the end of the testathon, triage will take place, where all tested issues will be reviewed.
7. If verified fixed, an issue will remain closed, and will have the “unverified” label removed.
8. For any bugs found, a severity will be assigned.
9. A second testathon will be scheduled for later in the week that will aim to address all issues identified as blockers, as well as any other issues scoped by the team during triage.
10. Any issues that were not tested will remain "unverified" and will be picked up in the next testathon.
