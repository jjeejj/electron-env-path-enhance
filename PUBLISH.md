# Publishing Guide

## Steps to Publish to npm

### 1. Prerequisites

Make sure you have:
- Registered an npm account
- Logged in to npm locally

```bash
npm login
```

### 2. Pre-publish Check

Run our pre-publish check script:

```bash
node scripts/pre-publish.js
```

### 3. Version Management

Update version number based on change type:

```bash
# Patch version (bug fixes)
npm version patch

# Minor version (new features)
npm version minor

# Major version (breaking changes)
npm version major
```

### 4. Final Testing

```bash
# Run all tests
npm test

# Build project
npm run build

# Check build output
ls -la dist/
```

### 5. Publish

```bash
# Publish to npm
npm publish

# If first time publishing, you may need:
npm publish --access public
```

### 6. Verify Publication

```bash
# Check if package is published
npm view electron-env-path-enhance

# Test installation in new directory
mkdir test-install
cd test-install
npm init -y
npm install electron-env-path-enhance
```

## Publishing Checklist

- [ ] All tests pass
- [ ] Build successful
- [ ] README documentation complete
- [ ] Version number updated
- [ ] Pre-publish check passed
- [ ] npm account logged in
- [ ] Execute npm publish

## Notes

1. **Version Number**: Follow Semantic Versioning (SemVer)
2. **Tags**: Add git tags after publishing
3. **Documentation**: Ensure README and API docs are up to date
4. **Testing**: Test package installation and usage in different environments

## After Publishing

1. Create GitHub Release
2. Update project documentation
3. Notify users of new version release