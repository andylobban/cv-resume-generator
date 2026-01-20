---
name: cv-tailor
description: Tailor Andrew's CV for specific job applications. Use when asked to adapt, tailor, customize, or create a version of the CV for a specific job, role, company, or job ad. Analyzes job requirements, adapts CV content, generates markdown, then produces PDF via the cv-generator tool.
---

# CV Tailor

Adapts Andrew Lobban's CV for specific job applications.

## Configuration

```
CV_GENERATOR_PATH: ~/Development/cv-generator
BASE_CVS_DIR: ~/Development/cv-generator/cvs
OUTPUT_DIR: ~/Development/cv-generator/cvs/roles
```

## Base CV Selection

Base CVs live in `cvs/` with naming pattern `andrew-lobban-{keyword}.md`:
- `andrew-lobban-design.md` → keyword: **design**
- `andrew-lobban-product.md` → keyword: **product**
- `andrew-lobban-consultant.md` → keyword: **consultant**

User specifies which base to use:
```
Tailor my CV for this role using design: [job ad]
Tailor my CV using product for: [job ad]
```

If no keyword specified, infer from role type or ask.

## Workflow

### Step 1: Extract job requirements

From the job ad, extract:
- **Company name** (for filename: lowercase, no spaces, e.g., "stripe")
- **Role title**
- **Key requirements** (must-haves, nice-to-haves)
- **Keywords** (technologies, methodologies, domain terms)
- **Company context** (stage, industry, culture signals)

### Step 2: Load and adapt CV

1. Read base CV from `~/Development/cv-generator/cvs/andrew-lobban-{keyword}.md`
2. Read `references/adaptation-guide.md` for adaptation rules
3. Apply adaptations:
   - Rewrite profile to emphasize relevant experience
   - Reorder strengths to lead with most relevant
   - Adjust achievement emphasis (don't fabricate - only highlight existing facts)
   - Integrate keywords naturally where truthful

### Step 3: Write markdown file

Save adapted CV to:
```
~/Development/cv-generator/cvs/roles/andrew-lobban-{companyname}.md
```

### Step 4: Human review checkpoint

**STOP HERE.** Open the file for the user to review:

1. Use `cat` or `view` to display the **complete file contents** - not a summary
2. Show the entire markdown file so the user can read through it
3. Then ask:

> "Here's the tailored CV. Review it above and let me know if you'd like any changes, or say 'generate' to create the PDF."

**Do not summarize changes.** Show the full document.

Wait for explicit approval before proceeding.

### Step 5: Generate PDF

Only after user approves, run:
```bash
cd ~/Development/cv-generator && node src/build.js cvs/roles/andrew-lobban-{companyname}.md
```

Output will be at:
```
~/Development/cv-generator/output/andrew-lobban-{companyname}.pdf
```

Confirm PDF generation and provide the path.

## Quick Reference

| What changes | What stays fixed |
|--------------|------------------|
| Profile summary | Contact details |
| Strengths order | Dates |
| Achievement emphasis | Company names |
| Keyword integration | Job titles |
| | Factual claims |

## Files

- `references/adaptation-guide.md` - Detailed adaptation rules

Base CVs are read from `~/Development/cv-generator/cvs/` at runtime.
