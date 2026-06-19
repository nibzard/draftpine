# Public Website Blocks

Draftpine's default theme is optimized for public-facing websites: landing pages, pricing pages, company pages, contact pages, resources, and utility routes. The blocks are plain HTML partials with structured props, so they remain static, portable, and easy to review.

## Reference Direction

The catalog is inspired by modern public-site systems such as Untitled UI, Vercel, Cal.com, Linear, Clerk, and Supabase. Draftpine does not depend on React, Tailwind, or component packages. The equivalent patterns are implemented as static HTML/CSS blocks.

## Block Families

| Family | Blocks | Use For |
| --- | --- | --- |
| Core | `hero`, `section-header`, `banner`, `callout`, `cta-split`, `not-found` | Page framing, announcements, conversion bands, utility routes |
| Proof | `logo-cloud`, `press-logos`, `metrics`, `social-proof`, `testimonial`, `testimonial-grid`, `case-study`, `case-study-grid` | Trust, customer proof, outcomes, press mentions |
| Features | `feature-icons`, `feature-tabs`, `feature-showcase`, `integrations-grid` | Product/service value, ecosystems, comparison of use cases |
| Conversion | `pricing`, `comparison`, `faq`, `newsletter`, `contact` | Pricing decisions, objection handling, lead capture |
| Company | `values`, `team`, `careers`, `job-list`, `locations` | About pages, hiring pages, office/service area pages |
| Content | `resource-list`, `blog-list`, `article`, `author-bio`, `rich-text`, `steps`, `changelog` | Blogs, guides, docs-style content, release notes, legal content |
| Legacy Generic | `card-grid`, `table`, `directory`, `form`, `settings`, `detail`, `timeline`, `proof` | Compatibility and one-off product UI prototypes |

## Page Coverage Matrix

| Page Type | Required Blocks | Optional Blocks |
| --- | --- | --- |
| Home | `hero`, `logo-cloud`, `feature-icons`, `feature-showcase`, `social-proof`, `callout` | `banner`, `metrics`, `testimonial-grid`, `case-study`, `press-logos`, `newsletter` |
| Pricing | `hero`, `pricing`, `comparison`, `faq`, `callout` | `social-proof`, `testimonial`, `contact`, `case-study` |
| About | `hero`, `values`, `team`, `rich-text` | `careers`, `job-list`, `article`, `resource-list` |
| Contact | `hero`, `contact`, `faq` | `locations`, `newsletter`, `cta-split` |
| Resources | `hero`, `blog-list`, `article`, `author-bio` | `resource-list`, `changelog`, `newsletter` |
| Careers | `hero`, `careers`, `job-list`, `values` | `team`, `locations`, `faq` |
| Case Studies | `hero`, `case-study-grid`, `case-study` | `testimonial-grid`, `press-logos`, `cta-split` |
| Legal | `hero`, `rich-text` | `section-header`, `faq` |
| 404 | `not-found` | `resource-list`, `cta-split` |

## Block Contracts

Each block should follow these conventions:

- `title` and `body` carry the main message unless the block has a specialized field like `headline` or `quote`.
- Repeated content uses plural arrays such as `items`, `posts`, `jobs`, `locations`, or `stats`.
- Public CTAs use explicit labels: `View pricing`, `Contact sales`, `Read story`, not `Submit` or `OK`.
- Forms keep labels in markup and use `data-draftpine-action="primary"` on the primary button.
- Blocks should stay useful without JavaScript. Interactive-looking sections such as `feature-tabs` must still show content statically.

## Starter Routes

The default browsable starter renders:

- `/` Home
- `/pricing/` Pricing
- `/about/` About
- `/contact/` Contact
- `/resources/` Resources
- `/404/` Not found

`/404/` is rendered but excluded from header and footer navigation.
