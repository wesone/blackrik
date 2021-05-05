# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
### Changed
- Renamed workflow property `currentEvent` to `event`
- Renamed workflow function `transition` to `trigger`
- EventBus adapter interface and added function `stop`
- EventStore adapter interface and added function `close`
- ReadModelStore adapter interface and added function `close`

### Fixed
- Bug where MySQL read model adapter may override an open database connection with a new one which results in closing only the latest connection

### Added
- Alternative HTTP route to execute commands
- New property `latestEventPosition` inside the context of commands
- Blackrik function `stop` to stop a running application

## [1.1.1] - 2021-04-19
### Changed
- MySQL read model schema types are now case insenitive

### Fixed
- Workflows no longer create a new state for every event in case of a replay
- Bug where MySQL read model did not add indices after a schema change

### Added
- Support for variable-length strings in MySQL read model schema

## [1.1.0] - 2021-04-14
### Changed
- Renamed errors property `code` to `status` to let Express handle status codes from thrown errors
- Error handling for saving events to the event store

### Fixed
- MySQL event store adapter no longer rejects events without payload

### Added
- Wrapped route handlers and middleware to catch and handle errors as errors in async functions are only handled by Express 5 or higher (which is not production ready yet)
- A way to set the context for commands and queries with the config property `contextProvider`
- Workflows for Sagas to use them as a state machine (this is optional)

## [1.0.3] - 2021-04-09
### Changed
- MySQL read model store adapter now returns plain objects instead of BinaryRow objects

### Fixed
- Bug where it was possible that the public Blackrik functions (executeCommand, executeQuery, ...) lose their scope

## [1.0.2] - 2021-04-08
### Changed
- Updated README.md
- MySQL read model store adapter now throws an error if a key was explicitly set to `undefined` inside query

### Fixed
- MySQL read model store adapter no longer throws an error if a primary-key field comes after a non-primary-key field inside scheme (defineTable)

### Added
- Keywords to package.json

## [1.0.1] - 2021-04-07
### Added
- Initial release

[Unreleased]: https://github.com/wesone/blackrik/compare/v1.1.1...HEAD
[1.1.1]: https://github.com/wesone/blackrik/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/wesone/blackrik/compare/v1.0.3...v1.1.0
[1.0.3]: https://github.com/wesone/blackrik/compare/v1.0.2...v1.0.3
[1.0.2]: https://github.com/wesone/blackrik/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/wesone/blackrik/compare/v1.0.0...v1.0.1
