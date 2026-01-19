# CV Generator

A self-contained system for generating professionally designed CVs from Markdown files. Edit your CV in Markdown, run a single command, get a print-ready PDF.

## Features

- **Markdown-based**: Write CVs in Markdown with YAML front matter
- **Professional design**: Clean, typography-focused PDF output
- **Custom fonts**: Support for your own web fonts
- **Fast workflow**: Preview in browser, generate PDF in seconds
- **Multiple versions**: Maintain different CV versions (design-focused, product-focused, hybrid)
- **GitHub-ready**: Proper .gitignore for fonts and outputs

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Install Playwright browsers (first time only)
npx playwright install chromium

# 3. Add your font files to /fonts/ (see Font Setup below)

# 4. Generate a PDF
npm run generate

# Or preview in browser first
npm run preview
```

## Project Structure

```
cv-generator/
├── cvs/                    # Your CV markdown files
│   └── andrew-lobban-design.md
├── fonts/                  # Custom font files (gitignored)
│   └── (your .woff/.woff2 files)
├── templates/              # HTML/CSS templates
│   ├── cv.html
│   └── cv.css
├── output/                 # Generated PDFs (gitignored)
├── src/
│   └── build.js           # Build script
├── package.json
├── .gitignore
└── README.md
```

## Commands

| Command | Description |
|---------|-------------|
| `npm run preview` | Generate HTML and open in browser for preview |
| `npm run generate` | Generate PDF from the most recently modified CV |
| `npm run generate:all` | Generate PDFs for all CV files in /cvs/ |
| `npm run watch` | Watch for changes and auto-regenerate |
| `npm run clean` | Remove all generated files from /output/ |

### Command Line Options

```bash
# Generate specific CV
node src/build.js cvs/my-cv.md

# Preview specific CV
node src/build.js cvs/my-cv.md --preview

# Generate all CVs
node src/build.js --all

# Watch mode
node src/build.js --watch
```

## Font Setup

This project uses custom fonts. You need to provide your own font files.

### Required Font Files

Place your font files in the `/fonts/` directory:

```
fonts/
├── CustomFont-Regular.woff2
├── CustomFont-Regular.woff
├── CustomFont-Bold.woff2
├── CustomFont-Bold.woff
├── CustomFont-Italic.woff2
├── CustomFont-Italic.woff
├── NameFont.woff2          # Decorative font for the name
└── NameFont.woff
```

### Configuring Fonts

1. Edit `templates/cv.css` to update the `@font-face` declarations with your actual font file names
2. Update the `--font-body` and `--font-name` CSS variables if needed

Example:
```css
@font-face {
  font-family: 'YourFontName';
  src: url('../fonts/YourFont-Regular.woff2') format('woff2'),
       url('../fonts/YourFont-Regular.woff') format('woff');
  font-weight: 400;
  font-style: normal;
}
```

### Fallback Fonts

If font files are missing, the system will fall back to system fonts:
- Body: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif
- Name: Georgia, serif

## Creating CV Versions

### 1. Duplicate an existing CV

```bash
cp cvs/andrew-lobban-design.md cvs/andrew-lobban-product.md
```

### 2. Edit the new file

CVs use YAML front matter for structured data:

```yaml
---
name: Your Name
phone: "+44 1234567890"
email: you@example.com
linkedin: linkedin.com/in/you
linkedinUrl: https://linkedin.com/in/you
website: yoursite.com
websiteUrl: https://yoursite.com
location: Your Location

profile: |
  <p>Your profile text here. Use <strong>bold</strong> for emphasis.</p>

strengths:
  - First strength
  - Second strength
  - Third strength

experienceSummary:
  - title: Job Title
    company: Company Name
    date: "2020 – Present"

experience:
  - title: Job Title
    company: Company Name
    date: "2020 – Present"
    description: Brief company description.
    achievements:
      - First achievement
      - Second achievement

education:
  - degree: Your Degree
    institution: University Name
    date: "2000 – 2004"
---
```

### 3. Generate the PDF

```bash
npm run generate
# or
node src/build.js cvs/andrew-lobban-product.md
```

## Customizing the Design

### Colors

Edit CSS variables in `templates/cv.css`:

```css
:root {
  --color-accent: #C84C1C;      /* Section headers */
  --color-text: #1a1a1a;        /* Body text */
  --color-text-light: #666666;  /* Dates, subtitles */
}
```

### Typography

```css
:root {
  --font-body: 'YourFont', sans-serif;
  --font-name: 'YourNameFont', serif;
}
```

### Spacing & Layout

Adjust spacing variables and grid layouts in the CSS file.

### Page Settings

PDF page settings are in `src/build.js`:

```javascript
await page.pdf({
  format: 'A4',
  margin: {
    top: '15mm',
    right: '12mm',
    bottom: '15mm',
    left: '12mm',
  },
});
```

## Tailoring for Job Applications

1. Create a copy of your base CV:
   ```bash
   cp cvs/andrew-lobban-design.md cvs/andrew-lobban-company-role.md
   ```

2. Tailor the content:
   - Adjust profile to emphasize relevant experience
   - Reorder or highlight specific achievements
   - Add relevant keywords

3. Generate:
   ```bash
   node src/build.js cvs/andrew-lobban-company-role.md
   ```

## Pushing to GitHub

Before pushing to a public repository:

1. **Check .gitignore is working:**
   ```bash
   git status
   ```
   Ensure `/fonts/` and `/output/` files are not listed.

2. **Don't commit:**
   - Font files (licensed/paid fonts)
   - Generated PDFs
   - Any personal documents you don't want public

3. **Do commit:**
   - All code and templates
   - Example CV markdown (or sanitized version)
   - README and documentation

## Troubleshooting

### Fonts not loading in PDF

1. Check font files exist in `/fonts/`
2. Verify file names match `@font-face` declarations in CSS
3. Check browser console in preview mode for 404 errors

### PDF generation fails

1. Ensure Playwright is installed: `npx playwright install chromium`
2. Check Node.js version is 18+: `node --version`

### Styling looks wrong

1. Use preview mode (`npm run preview`) to debug in browser
2. Check browser dev tools for CSS errors
3. Ensure CSS variables are properly defined

## Requirements

- Node.js 18+
- npm or yarn

## License

Private use. Do not redistribute font files.
