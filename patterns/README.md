# Draftpine Patterns

Patterns are the primary building blocks for Draftpine screens. Agents should assemble a screen-specific recipe from these patterns instead of copying a whole finished example.

Use this flow:

1. Normalize the prompt into a screen packet.
2. Pick 5-9 patterns that match the screen's job.
3. Declare those pattern names in `draftpine.config.json` under `patterns`.
4. Build one coherent root wireframe in `index.html`, `styles.css`, and `app.js`.
5. Use `examples/` only as reference for completed-screen quality.

Patterns are not component-library code. They are implementation guidance for plain HTML, Pico CSS, and Alpine.js.

## Catalog

### Page Chrome

- Announcement bar
- Sticky header / nav
- Flat nav
- Mega-menu nav
- GitHub/star trust pill
- Status indicator
- Mega footer
- SEO-directory footer

### Hero

- Outcome hero with CTA pair
- Product screenshot hero
- Code/runtime hero
- Try-it-in-the-hero input
- Install-command hero
- Benchmark-as-headline hero
- Logo-as-frame hero
- Editorial manifesto hero

### Proof

- Under-hero logo wall
- Metric strip
- Customer story cards
- Testimonial wall
- Tweet/social-proof masonry
- Case-study banner above nav
- Compliance/security strip
- Backed-by investor strip

### Developer Product Proof

- Code tabs
- Copyable install snippet
- Request/response code block
- IDE + browser mock
- Terminal log panel
- Quickstart steps
- Cookbook/example gallery
- Integration logo grid
- Framework compatibility strip
- In-body proof index table

### Feature Sections

- Feature bento
- Alternating feature rows
- Primitive/product module stack
- Capability cards
- Use-case bento
- Audience-segmented section
- Differentiator band
- Deep-dive section with visual proof
- Product-spec / limits table

### Conversion

- CTA pair: self-serve + sales
- Docs link CTA
- Final CTA band
- Pricing table
- Usage/cost calculator
- Pricing objection block
- Free-tier/risk-reducer strip
- Contact/demo enterprise card

### Interactions

- Tabs
- Accordion FAQ
- Filtered use-case/gallery grid
- Monthly/annual pricing toggle
- Populated/empty proof toggle
- Copy button
- Theme toggle
- Mobile nav
- Modal/dialog
- Expand/collapse wall

