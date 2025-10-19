# Gitea CI/CD Setup

This repository uses Gitea Actions for automated Docker builds and deployments.

## Workflow: Build and Deploy Docker Image

The workflow automatically builds and pushes Docker images to the private registry when:
- Code is pushed to the `main` branch
- A new tag starting with `v` is created
- A pull request is opened against `main`
- Manually triggered via the Actions UI

### Features

- **Multi-platform builds**: Creates images for both AMD64 and ARM64 architectures
- **Smart tagging**: Automatically tags images based on branch, tag, or commit SHA
- **Caching**: Uses GitHub Actions cache to speed up builds
- **Conditional deployment**: Only pushes images on actual merges, not on PRs

### Setup Required

#### 1. Enable Actions in Gitea

Make sure Actions are enabled in your Gitea instance and repository settings.

#### 2. Configure Registry Secrets

If your private registry requires authentication, add these secrets to your repository:

- `REGISTRY_USERNAME`: Username for registry authentication
- `REGISTRY_PASSWORD`: Password for registry authentication

If your registry doesn't require authentication, you can remove the login step from the workflow.

#### 3. Runner Requirements

The workflow requires a runner with:
- Docker support
- Access to the private registry network
- Sufficient resources for multi-platform builds

### Image Tags

The workflow generates the following tags:

- `latest`: For pushes to main branch
- `main`: For pushes to main branch
- `main-<short-sha>`: For each commit on main
- `v1.2.3`: For version tags
- `v1.2.3-<short-sha>`: For version tags with commit SHA

### Manual Trigger

You can manually trigger the workflow from the Actions tab in Gitea.

### Troubleshooting

- **Build failures**: Check the runner has access to the private registry
- **Authentication issues**: Verify the registry credentials are correct
- **Network issues**: Ensure the runner can reach `192.168.1.150:5000`

### Local Testing

To test the build locally before pushing:

```bash
make docker-build-lnx
```

This uses the same build configuration as the CI pipeline.