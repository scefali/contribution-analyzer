# Contribution Analyzer
This app is designed for managers to monitor the GitHub contributions of their team. It has the following features:

* Generate summaries of activities for a given GitHub user based on their merged pull requests using AI (OpenAI).
* Add members to your team in a UI and generate weekly reports of their GitHub activities.

## Environment Variables

To run this project, you will need to add the following environment variables to your .env file:

`SENTRY_DSN`
This is your Sentry Data Source Name, which is used for error tracking and monitoring. You can get this from your Sentry account.

`GITHUB_CLIENT_SECRET`
This is your GitHub client secret, which is used for GitHub OAuth. You can get this by creating a new OAuth app in your GitHub account.

`GITHUB_CLIENT_ID`
This is your GitHub client ID, which is used for GitHub OAuth. You can get this by creating a new OAuth app in your GitHub account.

`ALLOW_INDEXING`
This is a boolean value (true/false) that determines whether search engines are allowed to index the site. Set this to `true` to allow indexing, `false` to disallow.

`REDIS_CONNECTION_STRING`
This is your Redis connection string, which is used for caching. You can get this from your Redis hosting provider.

Please replace these with your actual values.
