# Publication guide

This fork relies on GitHub actions for simplicity. In order to publish new version you need to follow original instruction but doesn't expect that CircleCi pipeline will be executed (since it is not confugured). Instead, at the end, when you already create Release on GitHub, you can go to https://github.com/danielmiksavmlyr/identity-web-ui-sdk/actions and see if pipeline passes and if new version of package is published to the npm registry.

## Original repository flow

1. Start a new release branch.

    ```sh
    git checkout -b release/vx.y.z
    ```

2. Describe the new features and the fixes in the [CHANGELOG.md](CHANGELOG.md) file.
   Please update the git links at the end of the file (unreleased) + add a new git link comparing
   the last release to the changes brought by the current release.


3. Update the package's version with the command line below. It should respect the [semver](https://semver.org)
   versioning.

    ```sh
    npm --no-git-tag-version version [<newversion> | major | minor | patch]
    ```

   This command will update the version in the [package.json](package.json) and [package-lock.json](package-lock.json)
   files.

   Commit and push the change with the new version.

    ```sh
    git commit -am "vx.y.z"
    git push --set-upstream origin HEAD
    ```

4. Create a pull request named `Release vx.y.z` (add the Github tag `release`) and submit it.

5. Once the branch is merged into `master`, create the new tag.

    ```sh
    git tag <vx.y.z>
    git push origin <tag_name>
    ```

   [circleci](https://circleci.com) will automatically trigger a build, run the tests and publish the new version of the
   SDK on [npm](https://www.npmjs.com/package/@reachfive/identity-ui).

   > It's important to push the tag separately otherwise the [deployement job is not triggered](https://support.circleci.com/hc/en-us/articles/115013854347-Jobs-builds-not-triggered-when-pushing-tag).

   Refer to the [.circleci/config.yml](.circleci/config.yml) file to set up the integration.

6. Draft a new release in the [Github releases tab](https://github.com/ReachFive/identity-web-ui-sdk/releases) (
   copy/paste the changelog in the release's description).
