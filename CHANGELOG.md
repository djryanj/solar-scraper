# Changelog

All notable changes to this project will be documented in this file.

This repository uses GitHub Releases and Release Please to manage release notes and version history.

## [0.4.7](https://github.com/djryanj/solar-scraper/compare/v0.4.6...v0.4.7) (Unreleased)

### Changed

- chore(deps): lock file maintenance ([#76](https://github.com/djryanj/solar-scraper/pull/76))
- chore(deps): update googleapis/release-please-action action to v5 ([#77](https://github.com/djryanj/solar-scraper/pull/77))

## [0.4.6](https://github.com/djryanj/solar-scraper/compare/v0.4.5...v0.4.6) (2026-04-18)

### Bug Fixes

* release 0.4.6 ([98ec456](https://github.com/djryanj/solar-scraper/commit/98ec456e78128cad7b5588d2271cd0428ba9de2e))
* **ci:** use unprefixed `tag_name` output from release-please for root package releases
* **ci:** run PR container cleanup on all closed PRs, not only merged ones

## [0.4.5](https://github.com/djryanj/solar-scraper/compare/v0.4.4...v0.4.5) (2026-04-18)


### Bug Fixes

* actions version ([2ac87e6](https://github.com/djryanj/solar-scraper/commit/2ac87e67811482588bf3f867db0e104b58a3b8e9))
* **ci:** use releases_created and .--tag_name for release-please manifest mode outputs ([10aab6e](https://github.com/djryanj/solar-scraper/commit/10aab6e5af87070fb5f090d7ee47fbb5234d1744))
* **deps:** update dependency dotenv to ^17.4.1 ([ea167df](https://github.com/djryanj/solar-scraper/commit/ea167df0fcec176d08ea280f51fba7da8e39839d))
* **deps:** update dependency dotenv to ^17.4.1 ([7f2274e](https://github.com/djryanj/solar-scraper/commit/7f2274ec5a41ef5b33f0f00f9f999fa8631dd150))
* **deps:** update dependency mqtt to ^5.15.1 ([fd1068c](https://github.com/djryanj/solar-scraper/commit/fd1068c2d16fcefd3b3547245e4cd74c5a528f0c))
* **deps:** update dependency mqtt to ^5.15.1 ([d705490](https://github.com/djryanj/solar-scraper/commit/d705490459146b43f4db3e0d3c6d3981df1e0234))
* **deps:** update npm dependencies ([#67](https://github.com/djryanj/solar-scraper/issues/67)) ([3eb8de4](https://github.com/djryanj/solar-scraper/commit/3eb8de48f14e1bc3f307ee68924c0180a7651d4e))

## [0.4.5](https://github.com/djryanj/solar-scraper/compare/v0.4.4...v0.4.5) (2026-04-18)

### Changed

- chore(deps): update node.js to v24.15.0 ([#70](https://github.com/djryanj/solar-scraper/pull/70))
- chore(deps): update dependency node to v24.15.0 ([#69](https://github.com/djryanj/solar-scraper/pull/69))
- chore(deps): lock file maintenance ([#68](https://github.com/djryanj/solar-scraper/pull/68))
- chore(deps): update actions/github-script action to v9 [#66](https://github.com/djryanj/solar-scraper/pull/66)
- chore(deps): update actions/github-script action to v9 ([#71](https://github.com/djryanj/solar-scraper/pull/71))
- ci: add auto-changelog workflow for bot PRs
- fix(deps): update npm dependencies ([#67](https://github.com/djryanj/solar-scraper/pull/67))

## [0.4.4](https://github.com/djryanj/solar-scraper/compare/v0.4.3...v0.4.4) (2026-03-22)

### Bug Fixes

* dotenv message, scraper incorrectly parsing B panels ([40265e0](https://github.com/djryanj/solar-scraper/commit/40265e09624c90c5f83cb56973c03e15864cea39))
* dotenv message, scraper incorrectly parsing B panels ([70021eb](https://github.com/djryanj/solar-scraper/commit/70021ebe4417a1c7c16ca09ed73f0b2f72d00f94))
* **scraper:** handle ECU rowspan cells so dual-channel inverter B panels report correct grid frequency and temperature ([`components/scraper.js`](components/scraper.js))
* **server:** suppress dotenv v17 verbose startup log with `quiet: true` ([`bin/www`](bin/www))


### Tests

* update scraper fixture and unit tests to cover dual-channel rowspan HTML structure
* add live integration tests for real ECU scrape and MQTT pub/sub (`test/integration/live.test.js`)


### Documentation

* document live integration test variables and run instructions in README.MD and CONTRIBUTING.md

## [0.4.3](https://github.com/djryanj/solar-scraper/compare/v0.4.2...v0.4.3) (2026-03-21)


### Bug Fixes

* **ci:** trigger release container from release-please and add workflow_dispatch ([f760c06](https://github.com/djryanj/solar-scraper/commit/f760c06f2de6e5851ebbcf5cb207ff88505ec474))
* **ci:** use manifest-mode output keys for release_created and tag_name ([5aa4075](https://github.com/djryanj/solar-scraper/commit/5aa407588edc3ed216f325f91e7e8866a2d31659))

## [0.4.2](https://github.com/djryanj/solar-scraper/compare/v0.4.1...v0.4.2) (2026-03-21)


### Bug Fixes

* **deps:** update dependency dotenv to v17 ([495cf02](https://github.com/djryanj/solar-scraper/commit/495cf02a9c9641b6e2e9734ff3156b7df9c2a3ef))
* **deps:** update dependency dotenv to v17 ([9eb9c18](https://github.com/djryanj/solar-scraper/commit/9eb9c188f7fa6b948663a9b1deda5301c3ef1064))
* **deps:** update npm dependencies ([42711ea](https://github.com/djryanj/solar-scraper/commit/42711ea6e4352c942819224dc1b2de30f1390197))
* **deps:** update npm dependencies ([e1796c4](https://github.com/djryanj/solar-scraper/commit/e1796c47818919a84f9b7864465c0195f6e67735))

## [0.3.0] - 2026-03-20

### Changed

- Modernized the Node.js 24 runtime and container build.
- Added snapshot-based scraping, MQTT publishing updates, and improved runtime metadata.
- Added unit and integration test coverage with the built-in Node test runner.
- Added GitHub Actions workflows for CI, PR container publishing and cleanup, and release container publishing.

### Notes

- Future changelog entries are expected to be maintained by the Release Please workflow and GitHub Releases.
