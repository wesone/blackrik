# Contributing to Blackrik
If you'd like to contribute to Blackrik, please make sure you follow our [guidelines](#guidelines).

# Guidelines
To make development easier, there are a few rules that should be respected (yeah I know... rules 😒 but without them it would turn into an anarchy).

Just stick to our [workflow](#Workflow) and you should be fine.

## Workflow
Before you start, make sure there is no open issue that proposes your feature or fix (or whatever).  
If there is already an issue that kinda fits but does not exactly match your proposal, hook into the discussion.

Otherwise
1. Create a new [issue](https://guides.github.com/features/issues/) so your proposal can be discussed first.
2. Create a new [branch](https://docs.github.com/en/github/collaborating-with-issues-and-pull-requests/about-branches) of this repository to work in (see [branches](#Branches) for naming).
3. Implement your feature or fix or enhancement.
4. Make sure your code complies with our [codestyle](#codestyle): `$ npx eslint .`.
5. Add (or update) [tests](#testing) if needed.
6. Make sure all [tests](#testing) pass: `$ npm run test`.
7. Commit all changes to your branch (from step 2) and write useful commit messages for others to be able to undestand what changed.
8. Create a [pull request](https://docs.github.com/en/github/collaborating-with-issues-and-pull-requests/about-pull-requests) (PR) to inform others about your changes.
9. Your PR will be reviewed. If changes are requested, simply commit these to your branch.
10. After everything's right, someone will merge your branch into the master branch.

## Branches
When creating a new branch use the pattern `<category>/<topic>` or `<category>/<issue>/<topic>` for its name. Category may be one of the following `feature`, `bugfix`, `hotfix`, `docs`, ...  
While the topic describes what exactly the branch is about.  
You may add an issue id in-between e.g. `feature/42/my-feature` if issue #42 belongs to "my-feature".

Try to keep the name short e.g. instead of:  
`bugfix/there-is-a-bug-where-the-api-explodes-when-calling-specific-routes`  
just use:  
`bugfix/api-explosion`

## Codestyle
We use [ESLint](https://eslint.org/) to make sure the code has a consistent style. That style is described via rules inside the [.eslintrc.js](https://github.com/wesone/blackrik/blob/master/.eslintrc.js) file.

To test if all rules are satisfied run `$ npx eslint .` from the projects root directory (or `$ npx eslint <dir>`).  
ESLint can fix some problems automatically if you use `$ npx eslint --fix .` but be advised that the `--fix` flag might manipulate your code.

### Naming
Please use descriptive names (for functions, parameters, classes, variables, ...) in [camel case](https://en.wikipedia.org/wiki/Camel_case) (capital first letter for classes) and avoid abbreviations when possible.

## Testing
We use [Jest](https://jestjs.io/) as our testing framework. All unit tests can be found inside the `test/` folder that reflects the structure of the `src/` folder.

To run all tests use `$ npm run test` (which is a shortcut for `$ jest --testMatch=**/test/**/*.test.js --verbose --passWithNoTests`).

Code that introduces new features should always be covered with unit tests. If a test did not pass, either fix the code that gets tested or update the test to be up to date.

Run `$ npm run coverage` to generate a code coverage report that can be used to track down untested files.
