# Fix Docker Desktop BuildKit Issues on Apple Silicon Mac

## Problem
You're experiencing "exec format error" when building Docker images. This is caused by Docker Desktop's BuildKit trying to use AMD64 architecture instead of ARM64.

## Solution Steps

### Option 1: Restart Docker Desktop (Quickest)
1. Quit Docker Desktop completely
2. Open Activity Monitor and kill any remaining Docker processes
3. Restart Docker Desktop
4. Wait for it to fully start
5. Try the build again: `make docker-build-lnx`

### Option 2: Reset Docker Desktop to Defaults
1. Open Docker Desktop
2. Go to Settings (gear icon)
3. Click "Troubleshoot" in the left sidebar
4. Click "Reset to factory defaults"
5. Wait for Docker to restart
6. Try the build again: `make docker-build-lnx`

### Option 3: Reinstall Docker Desktop
1. Completely uninstall Docker Desktop:
   ```bash
   /Applications/Docker.app/Contents/MacOS/uninstall
   rm -rf ~/Library/Group\ Containers/group.com.docker
   rm -rf ~/Library/Containers/com.docker.docker
   rm -rf ~/.docker
   ```

2. Download the latest Docker Desktop for Apple Silicon from:
   https://www.docker.com/products/docker-desktop/

3. Install and start Docker Desktop

4. Verify it's working:
   ```bash
   docker --version
   docker ps
   docker info | grep "Operating System"
   ```

5. Try the build again: `make docker-build-lnx`

### Option 4: Build Without Docker (Alternative)
If Docker Desktop continues to have issues, you can:

1. Build directly on your Linux server
2. Use GitHub Actions or CI/CD to build images
3. Use a cloud build service

## After Fixing

Once Docker is working properly, run:
```bash
make docker-clean
make docker-build-lnx
```

## What Should Work

After fixing, you should see:
```
🔧 Checking Docker availability...
🔧 Checking Docker daemon...
✅ Docker daemon is running
🐳 Building Docker image...
[Successfully builds through all stages]
🐳 Pushing Docker image...
✅ Docker image built and pushed successfully!
```

## Additional Notes

- This error is specific to Apple Silicon Macs running Docker Desktop
- The "exec format error" means Docker is trying to run the wrong CPU architecture
- BuildKit can have issues with ARM64 emulation
- The legacy builder (DOCKER_BUILDKIT=0) also failed, indicating a deeper issue

## Support

If issues persist:
1. Check Docker Desktop version (should be latest)
2. Check macOS version compatibility
3. Look at Docker Desktop logs in Settings > Troubleshoot > View Logs
4. Consider reporting to Docker Desktop support
