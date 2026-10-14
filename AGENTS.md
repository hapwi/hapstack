# Hapstack maintenance

Keep changes focused and portable. User/repository instructions and concrete approval gates take precedence over library defaults. Preserve upstream attribution and the source pin when incorporating upstream changes.

No usernames, machine-specific absolute paths, credentials, live webhook URLs, private transcripts, or user settings belong in public sources. Public repository URLs and author attribution are allowed. Discover actual tools/models; never assume private host APIs exist. Maintain patcher/ship routing and the setup configuration contract.

For packaging or skill changes, check the affected skill metadata and local references. Run only checks needed for the changed behavior and requested acceptance criteria. Do not run a general audit, routine full suite, or unrequested agent review. Installation validation must use an isolated destination and must not overwrite existing user skills or activate external jobs.

