# Harbor Lane Coffee

Demo storefront for the Harbor Lane roastery: bean catalog, bag, promo codes
and a checkout form. Static HTML — any web server can host it.

## Branch: feature/pr-87

Carries the PR #87 preview work: refreshed bean catalog, the promo summary
lines and the checkout test suite.

## Preview Environment Details

- PR Number: 87
- Branch: feature/pr-87
- Environment: Preview
- Namespace: pr-preview-87
- Site content: the deployment serves its page out of ConfigMap
  `brew-app-pr87-html` (the site's `index.html` must live in there)
- Platform baseline: the preview namespace is provisioned by the platform
  crew; entries they have already placed there (e.g. `robots.txt`,
  `maintenance.html`) must remain in place
