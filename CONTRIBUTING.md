# Contributing

## Workflow

1. Create a branch from `main`.
2. Make focused changes with tests when behavior changes.
3. Run the local checks before opening a pull request.
4. Open a pull request with a clear summary of behavior, risks, and validation.

## Local Validation

Run the following before opening a pull request:

```bash
npm run check
npm test
```

Use coverage when you are changing behavior or expanding the test suite:

```bash
npm run test:coverage
```

### Live Integration Tests

`test/integration/live.test.js` requires a real ECU and/or MQTT broker and is skipped in normal `npm test` runs when the environment variables below are not set.

Run them explicitly against real hardware:

```bash
ECU_HOST=192.168.100.2 MQTT_HOST=mqtt.mosquitto node --test test/integration/live.test.js
```

See [README.MD](README.MD) for the full variable reference. When adding new live tests, keep them in this file and guard them with the same `skip:` pattern so CI is never broken.

## Commit Messages

This repository uses Release Please, so Conventional Commits are preferred.

Examples:

- `feat: add inverter status metadata`
- `fix: handle empty realtime table`
- `docs: document GHCR release flow`

## Pull Requests

Include:

1. What changed
2. Why it changed
3. How it was validated
4. Any rollout or compatibility concerns

## Releases

Normal releases are handled through the Release Please workflow.

Manual fallback commands are documented in [README.MD](README.MD).