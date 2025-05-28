# Extension Icons

This directory contains the icons for the ADO Naturale extension.

## Required Icon Sizes

The extension needs icons in the following sizes:
- `icon16.png` - 16x16 pixels (toolbar icon)
- `icon32.png` - 32x32 pixels (Windows taskbar)
- `icon48.png` - 48x48 pixels (extension management page)
- `icon128.png` - 128x128 pixels (Chrome Web Store)

## Design Guidelines

### Visual Design
- Use the brain emoji (🧠) or a stylized brain icon as the main element
- Incorporate Azure DevOps blue (#0078d4) as the primary color
- Keep the design simple and recognizable at small sizes
- Ensure good contrast for accessibility

### Technical Requirements
- PNG format with transparency
- Square aspect ratio
- High quality (no pixelation)
- Consistent design across all sizes

## Creating Icons

### Option 1: Using Design Software
1. Create a 128x128 pixel canvas
2. Design your icon using the brain theme
3. Export as PNG with transparency
4. Resize to create smaller versions (48x48, 32x32, 16x16)

### Option 2: Using Online Tools
- [Favicon.io](https://favicon.io/) - Generate from text or emoji
- [RealFaviconGenerator](https://realfavicongenerator.net/) - Comprehensive icon generator
- [Canva](https://canva.com/) - Design tool with icon templates

### Option 3: Placeholder Icons (Current)
For development purposes, you can use simple colored squares:
- Create solid colored PNG files in the required sizes
- Use Azure DevOps blue (#0078d4) as the background
- Add white text "AN" (ADO Naturale) in the center

## Current Status

**TODO**: Replace placeholder icons with proper designed icons before production release.

The extension currently uses placeholder references in `manifest.json`. Once proper icons are created, place them in this directory with the correct filenames. 