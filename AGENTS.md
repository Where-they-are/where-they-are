# Ultracite Code Standards

This project uses **Ultracite**, a zero-config preset that enforces strict code quality standards through automated formatting and linting.

## Quick Reference

- **Format code**: `pnpm dlx ultracite fix`
- **Check for issues**: `pnpm dlx ultracite check`
- **Diagnose setup**: `pnpm dlx ultracite doctor`

Biome (the underlying engine) provides robust linting and formatting. Most issues are automatically fixable.

---

## Core Principles

Write code that is **accessible, performant, type-safe, and maintainable**. Focus on clarity and explicit intent over brevity.

### Type Safety & Explicitness

- Use explicit types for function parameters and return values when they enhance clarity
- Prefer `unknown` over `any` when the type is genuinely unknown
- Use const assertions (`as const`) for immutable values and literal types
- Leverage TypeScript's type narrowing instead of type assertions
- Use meaningful variable names instead of magic numbers - extract constants with descriptive names

### Modern JavaScript/TypeScript

- Use arrow functions for callbacks and short functions
- Prefer `for...of` loops over `.forEach()` and indexed `for` loops
- Use optional chaining (`?.`) and nullish coalescing (`??`) for safer property access
- Prefer template literals over string concatenation
- Use destructuring for object and array assignments
- Use `const` by default, `let` only when reassignment is needed, never `var`

### Async & Promises

- Always `await` promises in async functions - don't forget to use the return value
- Use `async/await` syntax instead of promise chains for better readability
- Handle errors appropriately in async code with try-catch blocks
- Don't use async functions as Promise executors

### React & JSX

- Use function components over class components
- Call hooks at the top level only, never conditionally
- Specify all dependencies in hook dependency arrays correctly
- Use the `key` prop for elements in iterables (prefer unique IDs over array indices)
- Nest children between opening and closing tags instead of passing as props
- Use semantic HTML and ARIA attributes for accessibility:
  - Provide meaningful alt text for images
  - Use proper heading hierarchy
  - Add labels for form inputs
  - Include keyboard event handlers alongside mouse events
  - Use semantic elements (`<button>`, `<nav>`, etc.) instead of divs with roles

### Error Handling & Debugging

- Remove `console.log`, `debugger`, and `alert` statements from production code
- Throw `Error` objects with descriptive messages, not strings or other values
- Use `try-catch` blocks meaningfully - don't catch errors just to rethrow them
- Prefer early returns over nested conditionals for error cases

### Code Organization

- Keep functions focused and under reasonable cognitive complexity limits
- Extract complex conditions into well-named boolean variables
- Use early returns to reduce nesting
- Prefer simple conditionals over nested ternary operators
- Group related code together and separate concerns
- Keep application boundaries explicit; use shared packages for contracts and reusable code

### Security

- Add `rel="noopener"` when using `target="_blank"` on links
- Avoid `dangerouslySetInnerHTML` unless absolutely necessary
- Don't use `eval()` or assign directly to `document.cookie`
- Validate and sanitize user input
- Keep credentials and provider sessions out of source control

### Performance

- Avoid spread syntax in accumulators within loops
- Use top-level regex literals instead of creating them in loops
- Prefer specific imports over namespace imports
- Avoid barrel files (index files that re-export everything)
- Use proper image components (e.g., Next.js `<Image>`) over `<img>` tags

### Framework-Specific Guidance

**Next.js:**

- Use Next.js `<Image>` component for images
- Use `next/head` or App Router metadata API for head elements
- Use Server Components for async data fetching instead of async Client Components

**React 19+:**

- Use ref as a prop instead of `React.forwardRef`

**Solid/Svelte/Vue/Qwik:**

- Use `class` and `for` attributes (not `className` or `htmlFor`)

---

## Testing

- Write assertions inside `it()` or `test()` blocks
- Avoid done callbacks in async tests - use async/await instead
- Don't use `.only` or `.skip` in committed code
- Keep test suites reasonably flat - avoid excessive `describe` nesting

## When Biome Can't Help

Biome's linter will catch most issues automatically. Focus your attention on:

1. **Business logic correctness** - Biome can't validate your algorithms
2. **Meaningful naming** - Use descriptive names for functions, variables, and types
3. **Architecture decisions** - Component structure, data flow, and API design
4. **Edge cases** - Handle boundary conditions and error states
5. **User experience** - Accessibility, performance, and usability considerations
6. **Documentation** - Add comments for complex logic, but prefer self-documenting code

---

## Required implementation workflow

Every feature or group of related features must be decomposed into **small, modular todos before implementation begins**. Each todo must describe one independently reviewable change with a clear completion condition. Avoid a single broad todo such as “build the portal” when it can be split into smaller units such as “add the customer route,” “add the invoice query,” and “add the invoice table.”

Implement and verify one modular todo at a time. After each todo is complete, run the narrowest relevant checks and create a separate Git commit for that todo. Do not combine multiple completed todos into one commit. A todo that touches several files may still use one commit when all of those files are required for that one atomic change.

Use descriptive conventional commit messages, for example:

```text
feat(portal): add customer site status route
fix(payments): handle failed Paynow callbacks
chore(workspaces): register jobs worker
```

Keep the todo list and commit history aligned. If a todo is split further, update the todo list before continuing. Do not mark a todo complete until its checks pass and its commit has been created.

---

## Mandatory MVP scope gate

Before implementing any feature, read [`plans/MVP-SCOPE.md`](plans/MVP-SCOPE.md). That document is the authoritative boundary for the Where They Are MVP.

Every proposed feature must directly support the approved WhatsApp-to-intake-to-preview-to-payment-to-publication-to-hosting journey or the minimum operation required to deliver it. The target is a fast, high-quality brochure or service website for a Zimbabwean SME, not a general-purpose website builder, ecommerce platform, booking system, CRM, support suite, advanced analytics product, mobile app, or enterprise operations platform.

Agents must classify each proposal as **in scope**, **ambiguous**, **out of scope**, or **prohibited** before coding:

- For an in-scope proposal, state the supported MVP outcome and implement the smallest useful version.
- For an ambiguous proposal, ask the minimum questions needed to classify it; do not begin implementation while the classification is unresolved.
- For an out-of-scope or unnecessary proposal, push back respectfully. State the boundary it crosses, explain why it is not needed for MVP validation, propose a smaller in-scope alternative when possible, and recommend when it should be reconsidered.
- For prohibited work, such as invented customer facts or fabricated testimonials, refuse the implementation and preserve the grounding rule.

Do not implement an out-of-scope request merely because it was mentioned casually. If the project owner explicitly wants to change the scope, update `plans/MVP-SCOPE.md` first with the reason and tradeoff, then create small modular todos and separate commits for the approved change. Update `CONTEXT.md` and tests in the same task.

When scope is uncertain, use this response pattern:

> This is outside the current MVP because it creates a new product category rather than helping us deliver and host brochure websites. I recommend deferring it until the core delivery flow is validated. The smallest in-scope alternative is [alternative]. I will not implement the larger feature unless the MVP scope is explicitly changed in `plans/MVP-SCOPE.md`.

---

Most formatting and common issues are automatically fixed by Biome. Run `pnpm dlx ultracite fix` before committing to ensure compliance.
