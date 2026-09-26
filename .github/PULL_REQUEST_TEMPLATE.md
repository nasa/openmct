<!--- Note: Please open the PR in draft form until you are ready for active review. -->
Closes <!--- Insert Issue Number(s) this PR addresses. Start by typing # will open a dropdown of recent issues. Note: this does not work on PRs which target release branches -->

### Describe your changes:
<!--- Describe your changes and add any comments about your approach either here or inline if code comments aren't added -->

### Author Checklist

* [ ] Changes address the original issue
* [ ] Automated tests are included or updated with these changes
* [ ] Changes have been smoke tested
* [ ] The linked issue includes testing instructions, or I have added them in a comment on it
* [ ] The guidelines in our [Contributing document](https://github.com/nasa/openmct/blob/master/CONTRIBUTING.md) have been followed
* [ ] No other open [Pull Request](https://github.com/nasa/openmct/pulls) addresses the same issue

### Notable change?
<!--- Optional. Will this break compatibility with existing APIs, or with projects that consume
      these plugins? If so, describe it here so it can be called out in the release notes.
      See ../docs/src/process/release.md -->

### What happens next

A bot takes this from here, and will post a single comment that it keeps up to date:

1. It checks this pull request against the rules above and tells you anything that is missing.
2. Once those are met, it waits for the automated checks to pass.
3. It then asks for an AI code review. Reply to each comment from it, and to any security finding
   CodeQL raises, saying how you addressed it or why you disagree. A short reply is fine, and the bot
   resolves the thread for you.
4. Only then are the maintainers asked to review. That keeps their time for the things a human is
   needed for, and gets your work in front of them ready to read.

A pull request that stays incomplete is closed after a week, with a reminder first. Nothing is lost:
fix it up, comment `/recheck`, and it reopens. Converting to a draft gives you 30 days instead.

### Reviewer Checklist

* [ ] Changes appear to address issue?
* [ ] Reviewer has tested changes by following the provided instructions?
* [ ] Changes appear not to be breaking changes?
* [ ] Appropriate automated tests included?
* [ ] Code style and in-line documentation are appropriate?
