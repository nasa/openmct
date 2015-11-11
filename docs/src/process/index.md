# Development Cycle

Development of Open MCT Web occurs on an iterative cycle of
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
* Scheduling and/or ensuring adherance to
  [process points](#process-points).
* Responding to changes within the sprint (shifting priorities,
  new issues) and re-allocating work for the sprint as needed.

## Sprint Calendar

## Process Points

* __Sprint plan.__ Project manager allocates issues based on
  theme(s) for sprint, then reviews with team. Each team member
  should have roughly two weeks of work allocated (to allow time
  in the third week for testing of work completed.)
  * Project manager should also sketch out subsequent sprint so
    that team may begin work for that sprint during the
    third week, since testing and blocker resolution is unlikely
    to require all available resources.
* __Tag-up.__ Check in and status update among development team.
  May amend plan for sprint as-needed.
* __Code freeze.__ Any new work from this sprint
  (features, bug fixes, enhancements) must be integrated by the
  end of the second week of the sprint. After code freeze
  (and until the end of the sprint) the only changes that should be
  merged into the master branch should directly address issues
  needed to pass acceptance testing.
* __Acceptance Testing.__ Structured testing with predefined
  success criteria. No release should ship without passing
  acceptance tests. Time is allocated in each sprint for subsequent
  rounds of acceptance testing if issues are identified during a
  prior round. Specific details of acceptance testing need to be
  agreed-upon with relevant stakeholders and delivery recipients,
  and should be flexible enough to allow changes to plans
  (e.g. deferring delivery of some feature in order to ensure
  stability of other features.) Baseline testing includes:
  * __Testathon.__ Multi-user testing, involving as many users as
    is feasible, plus development team. Open-ended; should verify
    completed work from this sprint, test exploratorily for
    regressions, et cetera.
  * __24-Hour Test.__ A test to verify that the software remains
    stable after running for longer durations. May include some
    combination of automated testing and user verification (e.g.
    checking to verify that software remains subjectively
    responsive at conclusion of test.)
  * __Automated Testing.__ Automated testing integrated into the
    build. (These tests are verified to pass more often than once
    per sprint, as they run before any merge to master, but still
    play an important role in acceptance testing.)
* __Sprint Acceptance Testing.__ Subset of Acceptance Testing
  which should be performed before shipping at the end of any
  sprint. Time is allocated for a second round of
  Sprint Acceptance Testing if the first round is not passed.
* __Triage.__ Team reviews issues from acceptance testing and uses
  success criteria to determine whether or not they should block
  release, then formulates a plan to address these issues before
  the next round of acceptance testing. Focus here should be on
  ensuring software passes that testing in order to ship on time;
  may prefer to disable malfunctioning components and fix them
  in a subsequent sprint, for example.
* __Ship.__ Tag a code snapshot that has passed acceptance
  testing and deploy that version. (Only true if acceptance
  testing has passed by this point; if acceptance testing has not
  been passed, will need to make ad hoc decisions with stakeholders,
  e.g. “extend the sprint” or “defer shipment until end of next
  sprint.”)


