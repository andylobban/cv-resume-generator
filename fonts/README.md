# Font Files

Place your GT Flexa font files in this directory.

## Current Setup

The CV uses **GT Flexa** throughout:

### Currently installed:
- `GT-Flexa-Standard-Bold.woff2` - Used for all text (Bold weight)
- `GT-Flexa-Standard-Bold.woff` - Fallback format

### Optional additions for better typography:
If you have access to additional GT Flexa weights, add them for a closer match to the original design:

- `GT-Flexa-Standard-Regular.woff2` - For body text (lighter weight)
- `GT-Flexa-Standard-Medium.woff2` - For subtitles
- `GT-Flexa-Standard-Italic.woff2` - For company descriptions

Then update `@font-face` declarations in `templates/cv.css` accordingly.

## Important

- Font files are gitignored and will NOT be committed to the repository
- GT Flexa is a licensed font - do not share or commit to public repositories
- When cloning this repo, font files must be obtained and placed here separately
