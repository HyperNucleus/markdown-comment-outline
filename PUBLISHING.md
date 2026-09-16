# Marketplace release preparation

The intended extension ID is `HyperNucleus.markdown-comment-outline`. `HyperNucleus` is a candidate publisher ID, not a verified registration. Creating a GitHub fork does not create a Marketplace publisher.

1. Open the [Marketplace publisher management page](https://marketplace.visualstudio.com/manage) and create or select a publisher you own. Check whether `HyperNucleus` is available. If you select another ID, update `package.json` and README before packaging.
2. Follow the current [VS Code publishing guide](https://code.visualstudio.com/api/working-with-extensions/publishing-extension) to set up the publisher's authentication. Keep tokens in your credential store or CI secrets, never in source files or command arguments committed to Git.
3. In a clean checkout using Node 24, run `npm ci`, `npm run test:unit`, `npm test`, and `npm run package:vsix`. On Linux run the host tests with `xvfb-run -a npm test`.
4. Inspect the archive with `unzip -l markdown-comment-outline-0.1.0.vsix`. The package allowlist includes only the manifest, README, changelog, MIT license, icon, bundled extension and Activity Bar icon. Install the VSIX in a clean VS Code profile and verify Outline, Go to Symbol, the dedicated tree, navigation, highlighting and settings.
5. Confirm the manifest publisher, repository links, version and engine requirement. The independent fork starts at version `0.1.0`; upstream release versions below the fork entry in CHANGELOG are historical.
6. When you decide to publish, upload the verified VSIX through publisher management, or authenticate locally with `npx vsce login HyperNucleus` and run `npx vsce publish --packagePath markdown-comment-outline-0.1.0.vsix`. Do not paste authentication tokens into issue reports or chat.
7. Verify the published extension ID and install it from the listing. Tag the corresponding source commit only after the release result is known.

This implementation prepares the release and CI artifact only. It does not register a publisher, store credentials, create a public release, or publish to Marketplace/Open VSX automatically.
