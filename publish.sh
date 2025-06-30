#!/bin/bash

# Osito DEX Screener Adapter - Repository Publishing Script

echo "🚀 Osito DEX Screener Adapter Publishing Script"
echo "=============================================="

# Check if GitHub CLI is available
if command -v gh &> /dev/null; then
    echo "✅ GitHub CLI detected"
    USE_GH_CLI=true
else
    echo "⚠️  GitHub CLI not found. Manual setup required."
    USE_GH_CLI=false
fi

# Function to create GitHub repository
create_github_repo() {
    if [ "$USE_GH_CLI" = true ]; then
        echo "📦 Creating GitHub repository..."
        gh repo create osito-dex-screener-adapter \
            --public \
            --description "DEX Screener adapter for Osito protocol - enables tracking of Osito swap data on Berachain" \
            --homepage "https://github.com/Genmin/osito-dex-screener-adapter" \
            --clone=false
        
        if [ $? -eq 0 ]; then
            echo "✅ GitHub repository created successfully!"
            return 0
        else
            echo "❌ Failed to create GitHub repository"
            return 1
        fi
    else
        echo "📝 Manual GitHub repository creation required:"
        echo "   1. Go to https://github.com/new"
        echo "   2. Repository name: osito-dex-screener-adapter"
        echo "   3. Description: DEX Screener adapter for Osito protocol - enables tracking of Osito swap data on Berachain"
        echo "   4. Make it public"
        echo "   5. Don't initialize with README (we already have one)"
        echo ""
        read -p "Press Enter after creating the repository..."
        return 0
    fi
}

# Function to setup remote and push
setup_remote_and_push() {
    echo "🔗 Setting up remote origin..."
    
    # Remove any existing remote
    git remote remove origin 2>/dev/null || true
    
    # Add the remote
    git remote add origin https://github.com/Genmin/osito-dex-screener-adapter.git
    
    echo "📤 Pushing to GitHub..."
    git branch -M main
    git push -u origin main
    
    if [ $? -eq 0 ]; then
        echo "✅ Repository published successfully!"
        echo "🌐 Repository URL: https://github.com/Genmin/osito-dex-screener-adapter"
    else
        echo "❌ Failed to push to GitHub. Please check your credentials and try manually:"
        echo "   git remote add origin https://github.com/Genmin/osito-dex-screener-adapter.git"
        echo "   git branch -M main"
        echo "   git push -u origin main"
    fi
}

# Function to create a release
create_release() {
    if [ "$USE_GH_CLI" = true ]; then
        echo "🏷️  Creating v1.0.0 release..."
        gh release create v1.0.0 \
            --title "v1.0.0 - Initial Release" \
            --notes "Initial release of Osito DEX Screener Adapter with full DEX Screener API v1.1 compliance. See CHANGELOG.md for detailed features." \
            --latest
        
        if [ $? -eq 0 ]; then
            echo "✅ Release v1.0.0 created successfully!"
        else
            echo "⚠️  Release creation failed. You can create it manually later."
        fi
    else
        echo "📝 Manual release creation (optional):"
        echo "   1. Go to https://github.com/Genmin/osito-dex-screener-adapter/releases/new"
        echo "   2. Tag: v1.0.0"
        echo "   3. Title: v1.0.0 - Initial Release"
        echo "   4. Copy content from CHANGELOG.md"
    fi
}

# Main execution
echo ""
echo "Step 1: Creating GitHub repository..."
create_github_repo

echo ""
echo "Step 2: Setting up remote and pushing code..."
setup_remote_and_push

echo ""
echo "Step 3: Creating initial release..."
create_release

echo ""
echo "🎉 Publishing complete!"
echo ""
echo "📋 Next steps:"
echo "   • Repository: https://github.com/Genmin/osito-dex-screener-adapter"
echo "   • Clone: git clone https://github.com/Genmin/osito-dex-screener-adapter.git"
echo "   • Issues: https://github.com/Genmin/osito-dex-screener-adapter/issues"
echo "   • Releases: https://github.com/Genmin/osito-dex-screener-adapter/releases"
echo ""
echo "🛠️  To deploy the adapter, see README.md for detailed instructions." 