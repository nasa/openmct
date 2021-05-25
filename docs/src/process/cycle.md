# Development Cycle

Development of Open MCT occurs on an iterative cycle of
sprints and releases.

* A _sprint_ is three weeks in duration, and represents a
  set of improvements that can be completed and tested by the
  development team. Software at the end of the sprint is
  "semi-stable"; it will have undergone reduced testing and may carry
  defects or usability issues of lower severity, particularly if
  there are workarounds.
* A _release_ occurs every four sprints. Releases are stable, and
  will have undergone full acceptance testing to ensure that the
  software behaves correctly and usably.

## Roles

The sprint process assumes the presence of a __project manager.__
The project manager is responsible for
making tactical decisions about what development work will be
performed, and for coordinating with stakeholders to arrive at
higher-level strategic decisions about desired functionality
and characteristics of the software, major external milestones,
and so forth.

In the absence of a dedicated project manager, this role may be rotated
among members of the development team on a per-sprint basis.

Responsibilities of the project manager including:

* Maintaining (with agreement of stakeholders) a "road map" of work
  planned for future releases/sprints; this should be higher-level,
  usually expressed as "themes",
  with just enough specificity to gauge feasibility of plans,
  relate work back to milestones, and identify longer-term
  dependencies.
* Determining (with assistance from the rest of the team) which
  issues to work on in a given sprint and how they shall be
  assigned.
* Pre-planning subsequent sprints to ensure that all members of the
  team always have a clear direction.
* Scheduling and/or ensuring adherence to
  [process points](#process-points).
* Responding to changes within the sprint (shifting priorities,
  new issues) and re-allocating work for the sprint as needed.

## Sprint Calendar

Certain [process points](#process-points) are regularly scheduled in
the sprint cycle.

### Sprints by Release

Allocation of work among sprints should be planned relative to release
goals and milestones. As a general guideline, higher-risk work (large
new features which may carry new defects, major refactoring, design
changes with uncertain effects on usability) should be allocated to
earlier sprints, allowing for time in later sprints to ensure stability.

| Sprint | Focus                                                   |
|:------:|:--------------------------------------------------------|
| __1__  | Prototyping, design, experimentation.                   |
| __2__  | New features, refinements, enhancements.                |
| __3__  | Feature completion, low-risk enhancements, bug fixing.  |
| __4__  | Stability & quality assurance.                          |

### Sprints 1-3

The first three sprints of a release are primarily centered around
development work, with regular acceptance testing in the third
week. During this third week, the top priority should be passing
acceptance testing (e.g. by resolving any blockers found); any
resources not needed for this effort should be used to begin work
for the subsequent sprint.

| Week  | Mon                       | Tue    | Wed | Thu                          | Fri                                   |
|:-----:|:-------------------------:|:------:|:---:|:----------------------------:|:-------------------------------------:|
| __1__ | Sprint plan               | Tag-up |     |                              |                                       |
| __2__ |                           | Tag-up |     |                              | Code freeze  and sprint branch        |
| __3__ | Per-sprint testing        | Triage |     | _Per-sprint testing*_        | Ship and merge sprint branch to master|

&ast; If necessary.

### Sprint 4

The software must be stable at the end of the fourth sprint; because of
this, the fourth sprint is scheduled differently, with a heightened
emphasis on testing.

| Week   | Mon                       | Tue    | Wed | Thu                          | Fri         |
|-------:|:-------------------------:|:------:|:---:|:----------------------------:|:-----------:|
| __1__  | Sprint plan               | Tag-up |     |                              | Code freeze |
| __2__  | Per-release testing       | Triage |     |                              |             |
| __3__  | _Per-release testing*_    | Triage |     | _Per-release testing*_       | Ship        |

&ast; If necessary.

## Process Points

* __Sprint plan.__ Project manager allocates issues based on
  theme(s) for sprint, then reviews with team. Each team member
  should have roughly two weeks of work allocated (to allow time
  in the third week for testing of work completed.)
  * Project manager should also sketch out subsequent sprint so
    that team may begin work for that sprint during the
    third week, since testing and blocker resolution is unlikely
    to require all available resources.
  * Testing success criteria identified per issue (where necessary). This could be in the form of acceptance tests on the issue or detailing performance tests, for example.
* __Tag-up.__ Check in and status update among development team.
  May amend plan for sprint as-needed.
* __Code freeze.__ Any new work from this sprint
  (features, bug fixes, enhancements) must be integrated by the
  end of the second week of the sprint. After code freeze, a sprint
  branch will be created (and until the end of the sprint) the only 
  changes that should be merged into the sprint branch should 
  directly address issues needed to pass acceptance testing.
  During this time, any other feature development will continue to
  be merged into the master branch for the next sprint.
* __Sprint branch merge to master.__ After acceptance testing, the sprint branch
  will be merged back to the master branch. Any code conflicts that 
  arise will be resolved by the team.
* [__Per-release Testing.__](testing/plan.md#per-release-testing)
  Structured testing with predefined
  success criteria. No release should ship without passing
  acceptance tests. Time is allocated in each sprint for subsequent
  rounds of acceptance testing if issues are identified during a
  prior round. Specific details of acceptance testing need to be
  agreed-upon with relevant stakeholders and delivery recipients,
  and should be flexible enough to allow changes to plans
  (e.g. deferring delivery of some feature in order to ensure
  stability of other features.) Baseline testing includes:
  * [__Testathon.__](testing/plan.md#user-testing)
    Multi-user testing, involving as many users as
    is feasible, plus development team. Open-ended; should verify
    completed work from this sprint using the sprint branch, test 
    exploratorily for regressions, et cetera.
  * [__Long-Duration Test.__](testing/plan.md#long-duration-testing) A
    test to verify that the software remains
    stable after running for longer durations. May include some
    combination of automated testing and user verification (e.g.
    checking to verify that software remains subjectively
    responsive at conclusion of test.)
  * [__Unit Testing.__](testing/plan.md#unit-testing)
    Automated testing integrated into the
    build. (These tests are verified to pass more often than once
    per sprint, as they run before any merge to master, but still
    play an important role in per-release testing.)
* [__Per-sprint Testing.__](testing/plan.md#per-sprint-testing)
  Subset of Pre-release Testing
  which should be performed before shipping at the end of any
  sprint. Time is allocated for a second round of
  Pre-release Testing if the first round is not passed. Smoke tests collected from issues/PRs
* __Triage.__ Team reviews issues from acceptance testing and uses
  success criteria to determine whether or not they should block
  release, then formulates a plan to address these issues before
  the next round of acceptance testing. Focus here should be on
  ensuring software passes that testing in order to ship on time;
  may prefer to disable malfunctioning components and fix them
  in a subsequent sprint, for example.
* [__Ship.__](version.md) Tag a code snapshot that has passed release/sprint
  testing and deploy that version. (Only true if relevant
  testing has passed by this point; if testing has not
  been passed, will need to make ad hoc decisions with stakeholders,
  e.g. "extend the sprint" or "defer shipment until end of next
  sprint.")
