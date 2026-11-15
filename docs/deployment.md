# Production deployment

The production site is hosted on Netlify and connected to the `main` branch of this repository.

## Deployment checks

1. Confirm the latest commit is on `main`.
2. Confirm Netlify starts a production deploy for that commit.
3. Wait for the deploy state to become `ready`.
4. Smoke-test the public site and the `/api/platform-me` and `/api/platform-products` function routes.
5. Treat a successful static-site response as separate from successful authentication and API behavior; verify each endpoint independently.

The production site is https://atlandiascope-platform.netlify.app.
