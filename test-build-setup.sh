#!/bin/bash
# Test script to validate the mobile build process

set -e

echo "=== Testing Mobile Build Process ==="

# Test 1: Check if all required files exist
echo "1. Checking required files..."
required_files=(
    "package.json"
    "mobile-build.sh"
    "android/gradlew"
    "android/app/build.gradle"
    "src/index.js"
)

for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        echo "ERROR: Required file $file not found"
        exit 1
    else
        echo "✓ $file exists"
    fi
done

# Test 2: Check if npm dependencies can be installed
echo ""
echo "2. Testing npm install..."
if npm install --package-lock-only --dry-run; then
    echo "✓ npm dependencies look good"
else
    echo "ERROR: npm dependency issues detected"
    exit 1
fi

# Test 3: Check if mobile-build.sh is executable and shows help
echo ""
echo "3. Testing mobile-build.sh..."
if bash mobile-build.sh --help > /dev/null; then
    echo "✓ mobile-build.sh is functional"
else
    echo "ERROR: mobile-build.sh failed"
    exit 1
fi

# Test 4: Check Android configuration
echo ""
echo "4. Testing Android configuration..."
if [ -f "android/gradle.properties" ]; then
    if grep -q "org.gradle.java.home" android/gradle.properties; then
        echo "✓ Gradle Java home is configured"
    else
        echo "WARNING: Gradle Java home not configured"
    fi
else
    echo "ERROR: android/gradle.properties not found"
    exit 1
fi

# Test 5: Check if the workflow file is valid YAML
echo ""
echo "5. Testing workflow file..."
if [ -f ".github/workflows/build.yml" ]; then
    # Simple YAML validation by checking for basic structure
    if grep -q "name:" .github/workflows/build.yml && grep -q "jobs:" .github/workflows/build.yml; then
        echo "✓ Workflow file structure looks good"
    else
        echo "ERROR: Workflow file structure invalid"
        exit 1
    fi
else
    echo "ERROR: Workflow file not found"
    exit 1
fi

echo ""
echo "=== All tests passed! ==="
echo "The mobile build setup appears to be ready for CI/CD."