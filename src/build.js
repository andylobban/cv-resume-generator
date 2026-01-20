#!/usr/bin/env node

/**
 * CV Generator Build Script
 * Converts Markdown files with YAML front matter into professionally designed PDFs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';
import { marked } from 'marked';
import { chromium } from 'playwright';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

// Directories
const DIRS = {
  cvs: path.join(ROOT_DIR, 'cvs'),
  templates: path.join(ROOT_DIR, 'templates'),
  output: path.join(ROOT_DIR, 'output'),
  fonts: path.join(ROOT_DIR, 'fonts'),
};

// =============================================================================
// Template Engine (Simple Handlebars-like syntax)
// =============================================================================

// Fields that should render HTML without escaping
const HTML_FIELDS = ['profile', 'description', 'subtitle'];

/**
 * Find matching closing tag for a block, handling nested blocks
 */
function findMatchingClose(template, openTag, closeTag, startPos) {
  let depth = 1;
  let pos = startPos;

  while (depth > 0 && pos < template.length) {
    const nextOpen = template.indexOf(openTag, pos);
    const nextClose = template.indexOf(closeTag, pos);

    if (nextClose === -1) return -1; // No closing tag found

    if (nextOpen !== -1 && nextOpen < nextClose) {
      depth++;
      pos = nextOpen + openTag.length;
    } else {
      depth--;
      if (depth === 0) return nextClose;
      pos = nextClose + closeTag.length;
    }
  }
  return -1;
}

/**
 * Process a block type (each, if, unless)
 */
function processBlocks(template, data, blockType, processor) {
  let result = template;
  const openPattern = new RegExp(`\\{\\{#${blockType}\\s+(\\w+)\\}\\}`);
  const closeTag = `{{/${blockType}}}`;

  let match;
  while ((match = openPattern.exec(result)) !== null) {
    const key = match[1];
    const openTagEnd = match.index + match[0].length;
    const closePos = findMatchingClose(result, `{{#${blockType}`, closeTag, openTagEnd);

    if (closePos === -1) break;

    const content = result.slice(openTagEnd, closePos);
    const replacement = processor(key, content, data);

    result = result.slice(0, match.index) + replacement + result.slice(closePos + closeTag.length);
  }

  return result;
}

function renderTemplate(template, data) {
  let result = template;

  // Handle {{#each array}}...{{/each}} blocks
  result = processBlocks(result, data, 'each', (key, content, ctx) => {
    const array = getNestedValue(ctx, key);
    if (!Array.isArray(array)) return '';
    return array.map((item, index) => {
      const itemData = typeof item === 'object'
        ? { ...ctx, ...item, '@index': index }
        : { ...ctx, this: item, '@index': index };
      return renderTemplate(content, itemData);
    }).join('');
  });

  // Handle {{#if value}}...{{/if}} blocks
  result = processBlocks(result, data, 'if', (key, content, ctx) => {
    const value = getNestedValue(ctx, key);
    if (value && value !== false && (!Array.isArray(value) || value.length > 0)) {
      return renderTemplate(content, ctx);
    }
    return '';
  });

  // Handle {{#unless value}}...{{/unless}} blocks
  result = processBlocks(result, data, 'unless', (key, content, ctx) => {
    const value = getNestedValue(ctx, key);
    if (!value || value === false || (Array.isArray(value) && value.length === 0)) {
      return renderTemplate(content, ctx);
    }
    return '';
  });

  // Handle {{this}} for array iteration
  result = result.replace(/\{\{this\}\}/g, () => {
    return data.this !== undefined ? escapeHtml(String(data.this)) : '';
  });

  // Handle {{{variable}}} - triple braces for unescaped HTML
  result = result.replace(/\{\{\{(\w+)\}\}\}/g, (_, key) => {
    const value = getNestedValue(data, key);
    if (value === undefined || value === null) return '';
    return String(value);
  });

  // Handle {{variable}} placeholders
  result = result.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const value = getNestedValue(data, key);
    if (value === undefined || value === null) return '';
    // Don't escape HTML fields
    if (HTML_FIELDS.includes(key)) {
      return String(value);
    }
    return escapeHtml(String(value));
  });

  return result;
}

function getNestedValue(obj, path) {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : undefined;
  }, obj);
}

function escapeHtml(str) {
  const escapeMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return str.replace(/[&<>"']/g, char => escapeMap[char]);
}

// =============================================================================
// Markdown Processing
// =============================================================================

function parseMarkdownCV(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const { data: frontMatter, content: markdownBody } = matter(content);

  // Process profile from markdown if not in front matter
  if (!frontMatter.profile && markdownBody) {
    const profileMatch = markdownBody.match(/## Profile\s*([\s\S]*?)(?=##|$)/i);
    if (profileMatch) {
      frontMatter.profile = marked.parse(profileMatch[1].trim());
    }
  }

  // Parse name into first/last
  if (frontMatter.name) {
    const nameParts = frontMatter.name.split(' ');
    frontMatter.firstName = nameParts[0];
    frontMatter.lastName = nameParts.slice(1).join(' ');
  }

  return frontMatter;
}

// =============================================================================
// HTML Generation
// =============================================================================

function generateHTML(cvData) {
  const templatePath = path.join(DIRS.templates, 'cv.html');
  const cssPath = path.join(DIRS.templates, 'cv.css');

  let template = fs.readFileSync(templatePath, 'utf-8');
  const css = fs.readFileSync(cssPath, 'utf-8');

  // Inline CSS for PDF generation
  template = template.replace(
    '<link rel="stylesheet" href="cv.css">',
    `<style>${css}</style>`
  );

  // Fix font paths to be absolute
  const fontsAbsPath = DIRS.fonts;
  template = template.replace(
    /url\(['"]?\.\.\/fonts\//g,
    `url('file://${fontsAbsPath}/`
  );

  // Render template with CV data
  let html = renderTemplate(template, cvData);

  // Convert image paths to base64 data URLs for PDF generation
  html = html.replace(/src="images\/([^"]+)"/g, (match, filename) => {
    const imgPath = path.join(ROOT_DIR, 'images', filename);
    if (fs.existsSync(imgPath)) {
      const imgData = fs.readFileSync(imgPath);
      const base64 = imgData.toString('base64');
      const ext = path.extname(filename).slice(1).toLowerCase();
      let mimeType;
      if (ext === 'svg') mimeType = 'svg+xml';
      else if (ext === 'jpg') mimeType = 'jpeg';
      else mimeType = ext;
      return `src="data:image/${mimeType};base64,${base64}"`;
    }
    return match;
  });

  return html;
}

// =============================================================================
// PDF Generation
// =============================================================================

async function generatePDF(html, outputPath) {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.setContent(html, { waitUntil: 'networkidle' });

  // Wait for fonts to load
  await page.waitForTimeout(500);

  await page.pdf({
    path: outputPath,
    format: 'A4',
    margin: {
      top: '1.3cm',
      right: '1.5cm',
      bottom: '1.3cm',
      left: '1.5cm',
    },
    printBackground: true,
  });

  await browser.close();
}

// =============================================================================
// File Operations
// =============================================================================

function ensureOutputDir() {
  if (!fs.existsSync(DIRS.output)) {
    fs.mkdirSync(DIRS.output, { recursive: true });
  }
}

function getCVFiles() {
  if (!fs.existsSync(DIRS.cvs)) {
    console.error(`Error: CVs directory not found at ${DIRS.cvs}`);
    process.exit(1);
  }

  return fs.readdirSync(DIRS.cvs)
    .filter(file => file.endsWith('.md'))
    .map(file => path.join(DIRS.cvs, file));
}

function getLatestCV() {
  const files = getCVFiles();
  if (files.length === 0) {
    console.error('Error: No .md files found in cvs/ directory');
    process.exit(1);
  }

  // Sort by modification time, newest first
  files.sort((a, b) => {
    return fs.statSync(b).mtime.getTime() - fs.statSync(a).mtime.getTime();
  });

  return files[0];
}

// =============================================================================
// Preview Mode
// =============================================================================

async function preview(cvPath) {
  const cvData = parseMarkdownCV(cvPath);
  const html = generateHTML(cvData);

  ensureOutputDir();

  const baseName = path.basename(cvPath, '.md');
  const htmlPath = path.join(DIRS.output, `${baseName}.html`);

  // For preview, use relative font paths
  const previewHtml = html.replace(
    new RegExp(`file://${DIRS.fonts}/`, 'g'),
    '../fonts/'
  );

  fs.writeFileSync(htmlPath, previewHtml);

  console.log(`Preview HTML generated: ${htmlPath}`);
  console.log(`Open in browser: file://${htmlPath}`);

  // Try to open in default browser
  const { exec } = await import('child_process');
  const platform = process.platform;
  const command = platform === 'darwin' ? 'open' :
                  platform === 'win32' ? 'start' : 'xdg-open';

  exec(`${command} "${htmlPath}"`, (error) => {
    if (error) {
      console.log('Could not auto-open browser. Please open the file manually.');
    }
  });
}

// =============================================================================
// Watch Mode
// =============================================================================

async function watch() {
  const chokidar = await import('chokidar');

  console.log('Watching for changes in cvs/ and templates/...');
  console.log('Press Ctrl+C to stop.\n');

  const watcher = chokidar.watch([DIRS.cvs, DIRS.templates], {
    persistent: true,
    ignoreInitial: true,
  });

  watcher.on('change', async (filePath) => {
    console.log(`\nFile changed: ${filePath}`);

    if (filePath.endsWith('.md')) {
      await buildSingle(filePath);
    } else {
      // Template changed, rebuild latest CV
      const latestCV = getLatestCV();
      await buildSingle(latestCV);
    }
  });
}

// =============================================================================
// Build Functions
// =============================================================================

async function buildSingle(cvPath) {
  console.log(`Processing: ${path.basename(cvPath)}`);

  const cvData = parseMarkdownCV(cvPath);
  const html = generateHTML(cvData);

  // Determine output directory based on input path
  const isRolesCV = cvPath.includes(path.join('cvs', 'roles'));
  const outputDir = isRolesCV ? path.join(DIRS.output, 'roles') : DIRS.output;

  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const baseName = path.basename(cvPath, '.md');
  const pdfPath = path.join(outputDir, `${baseName}.pdf`);

  await generatePDF(html, pdfPath);

  console.log(`Generated: ${pdfPath}`);
}

async function buildAll() {
  const files = getCVFiles();

  console.log(`Found ${files.length} CV file(s) to process.\n`);

  for (const file of files) {
    await buildSingle(file);
  }

  console.log('\nAll CVs generated successfully!');
}

// =============================================================================
// CLI
// =============================================================================

async function main() {
  const args = process.argv.slice(2);

  const isPreview = args.includes('--preview') || args.includes('-p');
  const isAll = args.includes('--all') || args.includes('-a');
  const isWatch = args.includes('--watch') || args.includes('-w');

  // Get specific file if provided
  const fileArg = args.find(arg => !arg.startsWith('-') && arg.endsWith('.md'));
  const cvPath = fileArg ? path.resolve(fileArg) : getLatestCV();

  try {
    if (isWatch) {
      await watch();
    } else if (isPreview) {
      await preview(cvPath);
    } else if (isAll) {
      await buildAll();
    } else {
      await buildSingle(cvPath);
    }
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
