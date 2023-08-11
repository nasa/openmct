# Version Guide

This document describes semantics and processes for providing version
numbers for Open MCT, and additionally provides guidelines for dependent
projects developed by the same team.

Versions are incremented at specific points in Open MCT's
[Development Cycle](cycle.md); see that document for a description of
sprints and releases.

## Audience

Individuals interested in consuming version numbers can be categorized as
follows:

* _Users_: Generally disinterested, occasionally wish to identify version
  to cross-reference against documentation, or to report issues.
* _Testers_: Want to identify which version of the software they are
  testing, e.g. to file issues for defects.
* _Internal developers_: Often, inverse of testers; want to identify which
  version of software was/is in use when certain behavior is observed. Want
  to be able to correlate versions in use with “streams” of development
  (e.g. dev vs. prod), when possible.
* _External developers_: Need to understand which version of software is
  in use when developing/maintaining plug-ins, in order to ensure
  compatibility of their software.

## Version Reporting

Software versions should be reflected in the user interface of the
application in three ways:

* _Version number_: A semantic version (see below) which serves both to
  uniquely identify releases, as well as to inform plug-in developers
  about compatibility with previous releases.
* _Revision identifier_: While using git, the commit hash. Supports
  internal developers and testers by uniquely identifying client
  software snapshots.
* _Branding_: Identifies which variant is in use. (Typically, Open MCT
  is re-branded when deployed for a specific mission or center.)

## Version Numbering

Open MCT shall provide version numbers consistent with
[Semantic Versioning 2.0.0](http://semver.org/). In summary, versions
are expressed in a "major.minor.patch" form, and incremented based on
nature of changes to external API. Breaking changes require a "major"
version increment; backwards-compatible changes require a "minor"
version increment; neutral changes (such as bug fixes) require a "patch"
version increment. A hyphen-separated suffix indicates a pre-release
version, which may be unstable or may not fully meet compatibility
requirements.

Additionally, the following project-specific standards will be used:

* During development, a "-next" suffix shall be appended to the
  version number. The version number before the suffix shall reflect
  the next expected version number for release.
* Prior to a 1.0.0 release, the _minor_ version will be incremented
  on a per-release basis; the _patch_ version will be incremented on a
  per-sprint basis.
* Starting at version 1.0.0, version numbers will be updated with each
  completed sprint. The version number for the sprint shall be
  determined relative to the previous released version; the decision
  to increment the _major_, _minor_, or _patch_ version should be
  made based on the nature of changes during that release. (It is
  recommended that these numbers are incremented as changes are
  introduced, such that at end of release the version number may
  be chosen by simply removing the suffix.)
* The first three sprints in a release may be unstable; in these cases, a
  unique version identifier should still be generated, but a suffix
  should be included to indicate that the version is not necessarily
  production-ready. Recommended suffixes are:

 Sprint |  Suffix
:------:|:--------:
   1    | `-alpha`
   2    | `-beta`
   3    | `-rc`

### Scope of External API

"External API" refers to the API exposed to, documented for, and used by
plug-in developers. Changes to interfaces used internally by Open MCT
(or otherwise not documented for use externally) require only a _patch_
version bump.

## Incrementing Versions

At the end of a sprint, the [project manager](cycle.md#roles)
should update (or delegate the task of updating) Open MCT version
numbers by the following process:

1. Update version number in `package.json`
  1. Checkout branch created for the last sprint that has been successfully tested.
  2. Remove a `-next` suffix from the version in `package.json`.
  3. Verify that resulting version number meets semantic versioning
     requirements relative to previous stable version. Increment the 
     version number if necessary.
  4. If version is considered unstable (which may be the case during
     the first three sprints of a release), apply a new suffix per
     [Version Numbering](#version-numbering) guidance above.
2. Tag the release.
  1. Commit changes to `package.json` on the new branch created in 
     the previous step.
     The commit message should reference the sprint being closed,
     preferably by a URL reference to the associated Milestone in
     GitHub.
  2. Verify that build still completes, that application passes
     smoke-testing, and that only differences from tested versions
     are the changes to version number above.
  3. Push the new branch.
  4. Tag this commit with the version number, prepending the letter "v".
     (e.g. `git tag v0.9.3-alpha`)
  5. Push the tag to GitHub. (e.g. `git push origin v0.9.3-alpha`).
3. Upload a release archive.
  1. Use the [GitHub release interface](https://github.com/nasa/openmct/releases)
     to draft a new release.
  2. Choose the existing tag for the new version (created and pushed above.)
     Enter the tag name as the release name as well; see existing releases
     for examples. (e.g. `Open MCT v0.9.3-alpha`)
  3. Designate the release as a "pre-release" as appropriate (for instance,
     when the version number has been suffixed as unstable, or when
     the version number is below 1.0.0.)
  4. Add release notes including any breaking changes, enhancements, 
     bug fixes with solutions in brief.
  5. Publish the release.
4. Publish the release to npm
  1. Login to npm
  2. Checkout the tag created in the previous step.
  3. In `package.json` change package to be public (private: false)
  4. Test the package before publishing by doing `npm publish --dry-run` 
     if necessary.
  5. Publish the package to the npmjs registry (e.g. `npm publish --access public`) 
     NOTE: Use the `--tag unstable` flag to the npm publishj if this is a prerelease.
  6. Confirm the package has been published (e.g. `https://www.npmjs.com/package/openmct`)
5. Update snapshot status in `package.json`
  1. Create a new branch off the `master` branch.
  2. Remove any suffix from the version number, 
     or increment the _patch_ version if there is no suffix.
  3. Append a `-next` suffix.
  4. Commit changes to `package.json` on the `master` branch.
     The commit message should reference the sprint being opened,
     preferably by a URL reference to the associated Milestone in
     GitHub.
  5. Verify that build still completes, that application passes
     smoke-testing.
  6. Create a PR to be merged into the `master` branch.

Projects dependent on Open MCT being co-developed by the Open MCT
team should follow a similar process, except that they should
additionally update their dependency on Open MCT to point to the
latest archive when removing their `-next` status, and
that they should be pointed back to the `master` branch after
this has completed.
