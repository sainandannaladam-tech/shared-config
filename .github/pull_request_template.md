<!--
Title: [KEY-n] <short description>   add " (toggled)" at the end if the change is behind a feature toggle.
Keep every "## " heading below; write "None" where a section does not apply. The jira-key check enforces this.
Agents start the description with their role tag, for example [Dev].
-->

## Jira

<!-- Link to the item, for example https://sainandannaladam.atlassian.net/browse/PLAT-54 -->

## Summary

<!-- 1-3 bullets on why this change is needed, not a list of files. -->

## Changes

<!-- What changed, grouped by area (service, module, config). -->

## API and contracts

<!-- Endpoints, events or interfaces added or changed. Breaking change? Version? Or "None". -->

## Data and migrations

<!-- Schema or data changes, migration name, is it reversible? Or "None". -->

## Feature toggle

<!-- Required when the title ends with (toggled). Otherwise write "None". -->
- Toggle name:
- Default state: off
- How to turn it on:

## Security and privacy

<!-- Secrets, authentication, permissions, personal data, input validation. Or "None". -->

## Tests

<!-- Unit, integration and acceptance tests added or run, and their results. How to verify by hand. -->

## Risks and rollback

<!-- What could break and how to undo this change. -->

## Checklist

- [ ] Acceptance criteria of the Jira item are met
- [ ] All tests and checks pass
- [ ] No secrets or personal data in code, logs or this description
- [ ] Acceptance tests were not changed by the developer
- [ ] Documentation and Confluence pages updated (or not needed)
