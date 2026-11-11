# Math.js / MathLive mapping review

Reviewed 11 November 2026 against the installed Math.js 15.2.0 and MathLive 0.111.4. This is an investigation, not a change to the runtime converter.

Implementation follow-up: the app now maps natural/base logarithms, nth roots, absolute value/complex modulus, real/imaginary parts, and bounded sums/products. See `test/visual-operators.test.js`, `test/browser/advanced-math.spec.js`, and the README's supported-operators section. The original findings below describe the baseline before those fixes; other limitations, such as equality/assignment ambiguity and matrix indexing/transpose notation, remain outside this change. Integrals and derivative notation remain unsupported for evaluation.

## Findings

The current bridge is a presentation-to-text adapter, not a complete mathematical translator:

```text
Math.js source → Math.js AST → toTex() → MathLive editor
MathLive LaTeX → custom unit/name substitutions → ASCIIMath → Math.js parser
```

ASCIIMath and Math.js expression syntax are different languages. The bridge fixes selected names, units, arrays, and statement groups, but many remaining constructs either produce invalid Math.js or lose their original meaning. Math.js `toTex()` is intended to display a formula; it is not an invertible encoding of its expression tree.

Raw Math.js input can calculate correctly while its displayed formula is not safe to edit. The raw source remains authoritative until a visual input event, when `mathEditor()` replaces it with `unitSource(field.value)`. Thus a small visual edit can break an expression that worked in Settings. Saving both source and LaTeX does not prevent that conversion failure.

## Scope and reproduction

Run `node scripts/mapping-audit.mjs` from the project root. It prints individual cases and writes `test-results/mapping-audit.json`.

The probe covers 47 source-to-display-to-source cases and 28 direct visual expressions. Of the 44 source cases that originally evaluate, 28 reproduce the formatted result. These are deliberately selected examples, including difficult cases; this is not a general compatibility percentage. Equal results at one numeric input are also not proof of semantic equivalence. Additional checks of AST structure, matrix dimensions, bindings, and scope changes are needed for a permanent test suite.

Nine visual cases were also inserted into a real MathLive field in Edge and passed through the app's actual input handler. That confirmed the exported failures for logs, cube roots, determinants, transposes, integrals, sums, and absolute values, and success for the basic matrix grid. Browser observations are in `test-results/mapping-browser-audit.json` (generated investigation output, not a committed test).

## Compatibility observed

| Area | Works in the tested cases | Fails or needs a rule |
| --- | --- | --- |
| Elementary expressions | Arithmetic, fractions, square roots, powers, factorial, percentages, sine and hyperbolic sine | Indexed roots export as `root(3)(27)`, not `nthRoot(27,3)` |
| Names and definitions | Simple names, `ABC`, multi-letter names, `a_1`, function definitions | A subscript is ambiguous: a variable name, an index into a matrix, or a function's base can look similar |
| Logarithms | Direct visual `\log(100)` currently means Math.js natural log | `\ln` exports `ln`, which Math.js does not define. Base 2/10 notation exports `log _2(...)` / `log _(10)(...)`. Even raw `log`, `log2`, and `log10` fail the display round trip |
| Trigonometry | `sin(pi/2)`, `sinh(1)` | `asin`, `acos`, `atan` render as inverse-function superscripts and return as powers of function objects |
| Collections | Flat vectors, rectangular matrices, row/column shape, matrix addition/multiplication, elementwise multiplication, ranges | Indexing and transpose notation do not round-trip |
| Matrix functions | Named `det(...)`, `inv(...)`, `transpose(...)` | Determinant bars and superscript T/H are not mapped. Matrix inverse power -1 worked in the real-valued example, but transpose and conjugate transpose must remain distinct |
| Other functions | Named `floor`, `ceil`, `round`, `mod`, `complex`, `sum(vector)`, FFT tests already in the repository | Absolute-value bars and visual floor brackets do not map to their named functions |
| Comparisons | `<` | `<=` and `!=` return Unicode operators that Math.js rejects; `==` displays as `=` and can return as assignment |
| Logic and conditions | Raw Math.js can evaluate them | Boolean formatting and piecewise/cases notation do not round-trip |
| Calculus | MathLive can display integral and derivative notation; raw Math.js has symbolic differentiation | Integral signs do not translate, and the installed Math.js has no `integral`/`integrate` function. Derivative strings are also damaged by the display round trip |
| Bounded sums/products | `sum([1,2,3])` | `\sum_{k=1}^3 k` does not introduce a locally bound iterator in Math.js; `sum(k,k,1,3)` is not an equivalent built-in call |

Concrete outputs:

```text
log(100) → \ln(100) → ln(100) → Undefined function ln
log(8,2) → \log_2(8) → log _2(8) → Undefined function _2
asin(0.5) → \sin^{-1}(0.5) → sin^(-1)(0.5) → type error
abs(-3) → |-3| → |-3| → parse error
A[1,2] → A with subscript 1,2 → A_(1,2) → wrong function/name
∫₀¹ x² dx → int _0^1x^2 d x → undefined symbols
```

The most important failure is a change in meaning, not a red error: starting with scope `a=2`, the raw expression `a==3` is false and leaves `a` unchanged. Its rendered-and-reimported form is `a=3`, which returns 3 and changes `a`. An equality/assignment policy is necessary because the current UI already uses `=` for definitions and a final `=` for requesting a result.

## Recommended design

### 1. Establish a semantic contract

Keep Math.js as the numerical engine and preserve existing worksheets, units, ordering, sliders, and plots. Explicitly define:

- Natural log: `\ln(x)` ↔ `log(x)`; logarithm with a base: `\log_b(x)` ↔ `log(x,b)`. Decide the meaning of an unbased visual `log` and document it. Keeping its existing natural-log meaning avoids silently changing current calculations; explicit bases are preferable.
- Named subscripts such as `a_1` versus array access such as `A[1,2]`. These cannot be resolved by one global underscore replacement. Use explicit indexed access or a declared symbol/shape policy. Math.js expression indices are one-based.
- Matrix shape: a vector `[1,2]`, a one-row matrix `[[1,2]]`, and a column matrix `[[1],[2]]` remain different.
- Inverse functions versus reciprocal powers: `sin⁻¹(x)` and `(sin(x))⁻¹` must not become the same operation.
- Transpose `T` versus conjugate transpose `H`; assignments versus comparisons; trailing answer markers versus equality.
- Local variables in integrals, sums, and derivatives versus worksheet variables. An integral's `x` must not overwrite a worksheet definition of `x`.

### 2. Add conversion diagnostics before increasing coverage

Use a conversion result such as `{node, source, supported, diagnostics}` instead of returning an unqualified string. Every supported construct must consume its full input. Unknown commands, missing operands, and ambiguous notation should produce an explanation such as “Matrix indexing is not supported in visual mode; edit in Settings.”

Keep the original raw source during display and during incomplete edits. Once a visual edit is unsupported, clear/mark the answer as unavailable and prevent that edited field from defining downstream values. Do not show an old answer as if it belongs to the new formula, and do not silently substitute a different expression. The last valid source can be retained separately for recovery.

Do not treat a string that Math.js happens to parse as proof of a correct conversion. The `a==3` example demonstrates why that is insufficient.

### 3. Replace the ASCIIMath interchange with a semantic adapter

Preferred long-term route to prototype:

```text
MathLive LaTeX → LaTeX parser / MathJSON → worksheet semantic adapter
             → Math.js AST → evaluation

Math.js AST → worksheet-controlled LaTeX serialization → MathLive
```

The Cortex Compute Engine provides LaTeX parsing into MathJSON, so it is a good candidate to compare against a small dedicated parser. Use it first as a parser, not as a wholesale replacement for Math.js. Build an explicit allowlisted MathJSON-to-Math.js AST mapping. Account for names, units, assignments, dimensions, and indexing. Preserve editing structure rather than automatically simplifying/reordering the user's input.

This is a proposed architecture, not a verified drop-in integration: the Compute Engine was not installed or benchmarked in this review. Before adopting it, measure bundle cost and parser behavior against our examples, and pin a tested version. MathLive 0.111 removed `field.expression` and `getValue('math-json')`; parse `field.value` using a separately installed Compute Engine. Some general MathLive documentation still shows the old API, so use the versioned changelog/API when implementing.

For an incremental repair before that migration, create balanced/token-aware rules for natural/base logs, indexed roots, inverse trig, absolute value, and comparisons. Do not continue growing global regular-expression replacements for nested matrices, integrals, or piecewise expressions.

### 4. Treat integration as a separate capability

Numerical definite integration and symbolic indefinite integration are different features:

- Start with finite-bound numerical integrals of scalar functions. Add an explicit internal operation with a locally bound variable, tolerance/error reporting, and bounded execution. Exclude improper, divergent, complex, and unit-bearing integrals initially unless tested.
- Indefinite integrals require a symbolic integration engine or a supported subset with clear unevaluated results. Cortex documents symbolic and numerical integration, but that capability still needs an integration prototype and worksheet-scope tests.
- In the meantime, unsupported integral notation can remain editable display-only mathematics. It should say why evaluation is unavailable.

### 5. Build a permanent compatibility suite

For each supported construct, test direct visual entry, source-to-visual-to-source conversion, actual typing/editing in the browser, and Save/Load. Check numeric results, matrix shapes, assignments/scope effects, and unsupported/incomplete cases. Include nested logs, logarithms with variable bases, matrices containing formulas, complex transposes, and variables whose names resemble units.

Recommended order: prevent silent semantic changes; fix logs/roots/inverse trig/absolute values; complete matrix operators and indexing; then add finite sums/products and definite numerical integration. Prototype the structured parser before promising general calculus support.

## Primary references

- [Math.js logarithm semantics](https://mathjs.org/docs/reference/functions/log.html)
- [Math.js expression syntax and indexing](https://mathjs.org/docs/expressions/syntax.html)
- [Math.js expression trees and AST construction](https://mathjs.org/docs/expressions/expression_trees.html)
- [Math.js function reference](https://mathjs.org/docs/reference/functions.html)
- [Cortex LaTeX parsing and serialization](https://mathlive.io/compute-engine/guides/latex-syntax/)
- [Cortex calculus reference](https://mathlive.io/compute-engine/reference/calculus/)
- [MathLive 0.111 API changes](https://github.com/arnog/mathlive/blob/master/CHANGELOG.md)
