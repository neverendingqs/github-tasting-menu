[![CircleCI](https://circleci.com/gh/neverendingqs/github-tasting-menu.svg?style=svg)](https://circleci.com/gh/neverendingqs/github-tasting-menu)
[![Coverage Status](https://coveralls.io/repos/github/neverendingqs/github-tasting-menu/badge.svg?branch=master)](https://coveralls.io/github/neverendingqs/github-tasting-menu?branch=master)

# Tasting Menu GitHub App

## How it Works

Simply add a `.github/tasting-menu.yml` file with the following:

```yaml
pull_request:
  merged:
    - username: github-username-1
      frequency: 0.5
    - username: github-username-2
      frequency: 0.25
    - username: github-username-3
      frequency: 0.33
    - username: github-username-4
      frequency: 0.75
```
Every time a pull request is merged, each user in the list will be notified via
a comment based on their frequency. For example, `github-username-1` will be
notified 50% of the time.
