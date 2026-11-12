# Orbit — free-form mathematical worksheet

A small browser-first demo built with Vite, vanilla JavaScript, Math.js and MathLive. No server or SMath XML compatibility. Includes a basic 2D plot region.

## Run in VS Code

1. Install Node.js 22.12+ (or 24 LTS) and VS Code.
2. In VS Code, choose **File → Open Folder** and select this `math-worksheet` folder.
3. Open **Terminal → New Terminal** and run:

   ```sh
   npm install
   npm run dev
   ```

4. Open the local URL printed by Vite, usually http://127.0.0.1:5173.

Optional: run `code .` from this folder to open VS Code. Use the Vite server rather than opening `index.html` directly.

```sh
npm test          # calculation, order, plot data and JSON validation tests
npm run build    # production files in dist/
npm run preview  # serve the production build locally
npx playwright test  # browser integration test, requires Microsoft Edge
```

The browser test uses installed Microsoft Edge on Windows. On another platform, remove `channel: 'msedge'` from `playwright.config.js` and run `npx playwright install chromium` first.

## Use

- Click blank paper and type. Start with Space in an empty field to create a text note. Spaces inside a nonempty equation remain mathematical separators and never convert it into a note. Press Enter to calculate and begin a new equation below it. The right-hand Elements palette provides explicit region types.
- Equations evaluate automatically, but answers appear only when you add a final `=`. For example, `a=3` silently defines a variable, `a*2` calculates silently, and `a*2=` displays `6` after the equals sign. Interior equals signs still assign variables. Errors in evaluated fields remain visible even without a final `=`. Equations and answers share the same 20 px math font.
- For a pedagogical formula, open **⋮ → Settings** and check **Display only — do not evaluate**. The formula remains editable mathematical notation but never executes, defines variables or reports evaluation errors, even if it ends with `=`. Uncheck the option to resume evaluation. The mode is preserved in JSON and Undo/Redo.
- Hover over a field to reveal a faint rectangle and a compact strip of controls immediately to the right of its first line. Drag the dotted handle to move, drag the corner grip to resize a note/figure, or click × to delete. Equations fit their content; notes initially fit their text. Text fields also have a lower-right resize grip: after resizing, both width and height stay as chosen, Markdown wraps within that width, and overflow can scroll. These dimensions are preserved in JSON.
- MathLive provides the visual math editor and optional keyboard. Ordinary typing pauses numerical evaluation; press `=`, close a bracket, press Enter or leave the editor to calculate. The edited field's old answer is hidden while pending. Sliders and animation still update interactively. Greek names are recognized as complete identifiers at commit boundaries; longer names such as `thetaRate` stay intact.
- Click **⋮ → Settings** in an equation's right controls for direct Math.js syntax, including vectors, functions and units. This field accepts spaces without converting to text. Editing it updates both the evaluated source and the formatted equation on the canvas. Incomplete expressions are displayed literally until they can be formatted. Both source and displayed formula are preserved in JSON. Click the plot's **⚙** control for its series and range settings. These panels float over the page without changing field height.

`fft([1,0,0,0])` and `ifft([1,1,1,1])` can also be typed directly in the visual editor. FFT/IFFT names are recognized as functions, and vectors keep their one-dimensional shape when moving between Math.js source and visual notation. Other named functions entered through ƒ are rendered as named operators on the canvas. Advanced syntax outside the visual adapter's subset remains most reliable in ƒ.
- Every recalculation starts with an empty scope and evaluates math and plots by top edge (`y`), then left edge (`x`), then document order for exact ties. A variable must be defined above its use. Moving or deleting a definition recalculates downstream regions. Text and images do not affect scope. Each failing region shows its own error; subsequent regions continue without that region's assignments.
- The starter circular-orbit calculation uses SI numbers: Earth's gravitational parameter, a 400 km altitude, orbital velocity (~7672.6 m/s), and period (~5544.9 s). A plot shows circular speed as a function of radius. These are illustrative two-body calculations.
- Paste an image copied from a screenshot tool or image editor with Ctrl+V / Cmd+V. The paste creates an independent image region even when an editor is focused. Ordinary text paste remains with the focused editor. **Elements → Picture** provides a file-picker fallback after you choose its canvas position. PNG/JPEG/WebP/GIF up to 8 MB are embedded in the worksheet; new images start at their native pixel size (up to the sheet's 20,000 px dimension limit). Drag the lower-right grip to scale them with a fixed aspect ratio. The hover/selection frame stays tight around the image, including small images. Size is preserved in JSON and Undo/Redo. Older loose image frames are fitted tightly when loaded.
- **Save JSON** downloads geometry, content, visual math, evaluation source, plot settings and embedded images. **Load JSON** replaces the worksheet only after validation succeeds. Save before leaving: there is no automatic persistence.
- **Undo / Redo** restore recent content and layout changes, including group moves, deletion, images, controls and plot settings. Use Ctrl/Cmd+Z to undo, Ctrl/Cmd+Shift+Z or Ctrl+Y to redo, or the toolbar buttons. Consecutive typing is grouped; a drag is one command. A new edit clears Redo. History stays in this browser session, with up to 60 worksheet states and a memory limit; JSON files contain the current worksheet only.

Notes, images, plots and sections resize from their corner/boundary grip; their menus omit the duplicate resize button. Sliders and option controls retain a menu resize handle because they have no corner grip.

Every field has a **⋮** menu with **Settings**, **Colors**, and **Help** tabs. The first tab contains its settings; the last describes how the element works. Edit the minimized label directly on the minimized field. Under **Colors**, choose a **Background color** and **Box line color**; uncheck the corresponding option for no fill/line. A section's fill colors its header. These are separate presentation properties: they never rewrite math, text, image data, graph settings or geometry. Colors are saved in JSON and support Undo/Redo. The − button minimizes a field and □ restores it.

## Copy, paste and duplicate fields

Ctrl/Cmd-click a field or drag a selection rectangle to select complete objects. Use **Ctrl/Cmd+C**, move the pointer to the destination on the worksheet, then **Ctrl/Cmd+V**. A group keeps its relative layout, formatting, embedded pictures and settings; a section includes its contents. Pasted objects receive new IDs and remain selected. Paste and duplication support Undo/Redo.

Hold **Ctrl** (Cmd on macOS) while dragging a field's left grab handle or an edge to duplicate it. If it belongs to the current selection, the selected group is duplicated. The original stays in place while a translucent preview shows the destination. Dropping a copied section where it would overlap another section is rejected.

Inside an active editor, normal text/math selection copying remains available. MathLive's **Copy → Copy as Math.js** copies the selected expression, or the complete calculation source when there is no selection; the worksheet's trailing answer marker is omitted. Native LaTeX clipboard data can also be pasted as an equation. Plain text retains the existing note-paste behavior.

## Grouped calculations and field explanations

Type a top-level semicolon to add another statement inside the same equation field, for example `a=3;b=4;a+b=`. The field becomes a left-aligned vertical list with a thin vertical bar. Statements run sequentially in one shared worksheet position and move, hide, save, and undo as one field. The final `=` shows the last statement's value; without it the group calculates silently. Enter creates a separate equation below the whole group. Arrow keys navigate within the group; its **⋮ → Settings** source remains ordinary semicolon-separated Math.js expressions. Remove separators in **⋮ → Settings** to return to a single expression. Matrix row separators and semicolons inside strings remain part of their expression. Groups add no function-body, callback or loop syntax.

Every field, including a section, has an **ⓘ** control in its right-side menu. Click it to see or directly edit a short explanation. The popup contains just the text field, empty when unset. It accepts up to 250 printable ASCII characters. Explanations are preserved in JSON and Undo/Redo; information remains available on hidden fields.

## Vectors and matrices

MathLive's **Insert matrix** menu creates square-bracket matrices with the first cell ready for typing. Tab advances between cells. Existing parenthesis matrices are normalized to square brackets. In **⋮ → Settings**, use commas between columns and semicolons between rows, for example `[1,2;3,4]`; nested arrays `[[1,2],[3,4]]` work too. Both render as a two-dimensional grid and evaluate as a matrix. A vector `[1,2,3]` keeps its one-dimensional shape; `[1;2;3]` is a column matrix. Plots accept flat vectors, single-row matrices and single-column matrices for X/Y series.

Text notes support Markdown links: `[Reference](https://example.com)`. Hover over a note and use **Insert link** (↗), or select text while editing and press **Ctrl/Cmd+K**. Enter the label and address and click **Add link**. Links open in a new tab; the Markdown source remains editable and is saved with the note.

## Hidden fields, solution sections and fullscreen

Hover over a field and click **Hide field** (−). Only its editable label remains (Equation, Text, Picture, Plot, Slider or Options by default); a blank label leaves the field invisible at rest. Hover to reveal its outline, left grab handle and right-side extension menu, information, restore (□), and delete controls. Click restore to show the content again; double-clicking the label or blank field also restores it. Labels support up to 120 characters, Undo/Redo and JSON save/load. Minimized fields remain available to marquee selection and Select All, and can be dragged by their edges. Definitions and plots still evaluate.

Choose **Elements → Section**, then click or tap the canvas to place a full-width horizontal section. With fields selected, **Section around selection** wraps their vertical span, adding room for its header; all fields between its top and bottom boundaries belong to it, regardless of horizontal position. The ordinary Section tool creates an empty section at the clicked vertical position. Click blank paper between its boundaries to add fields normally. Edit its title directly, drag its right move handle to move the section and its contents vertically, or drag its bottom boundary to adjust its height. Sections cannot overlap or nest. Their headers follow the existing canvas width and do not enlarge it.

Click − beside a section title to minimize it, or □ to restore it. Closing hides the contents and pulls the visible sheet below upward without changing logical coordinates or evaluation order. Its header and arrow remain visible. Definitions inside still calculate. Deleting a section deletes its contents and closes its space; Undo restores them together. Enter/Backspace inside an open section adjust its height with the inserted/removed row.

For separate question and solution files, close the Solution section and save JSON, then open it and save again under a different filename. Each file remembers its own open/closed states. Hidden content remains part of the worksheet file.

The **fullscreen icon in the canvas menu bar** hides the slim title header and status bar. Canvas controls and insertion palettes remain available; use the icon again or Esc to exit browser fullscreen. Fullscreen is a viewing mode, not a saved worksheet setting.

Math.js calculation syntax is unchanged. A separate programming element and custom loop/block syntax have not been added.

## Selection and row editing

- Ctrl/Cmd-click (or Shift-click) fields to add/remove individual objects from the selection. Drag across blank paper to draw a selection rectangle; hold a selection modifier to add to the existing selection. A simple click on blank paper still starts an equation.
- Ctrl/Cmd+A anywhere in the worksheet selects all fields. Delete (or Backspace) while the canvas selection is active removes every selected field together. The explicit raw-expression/settings inputs retain their native Ctrl/Cmd+A behavior. Inside a text editor, Delete still edits text unless you first select worksheet objects.
- Drag the dotted move handle on any selected field to move the selected group together, preserving spacing. Selection works across math, notes, images and plots. Escape clears selection. A normal click on an unselected field clears the group.
- Enter in an equation inserts a blank definition field below it and shifts every later field down by one row (at least 38 px, larger for a tall equation). “Later” follows worksheet order: top to bottom, left to right for a shared top edge. Earlier fields stay in place. With a selected group, Enter from the canvas inserts a row after the last selected field. Markdown editors keep normal Enter/newline behavior.
- Fields with evaluation or plotting errors keep a faint red rectangle even without hover. The red outline clears automatically when the error is fixed.

Backspace in an empty equation or text field removes that field and pulls later objects up one row. The blinking cursor stays on the canvas; it never jumps into a neighboring field. Continue pressing Backspace to move up line by line and pull objects at/below that line upward. Object contents are preserved and motion stops at the top edge. Typing resumes a new equation at that canvas position; Enter opens a new row there. In a nonempty editor, Backspace still deletes characters. Group-selection Backspace deletes the selected objects without shifting the rest of the sheet.

Empty fields are removed when focus leaves them, when you press Escape, or before saving. A newly created empty field remains while you are typing into it. Whitespace-only notes and cleared plot series also count as empty.

Paste text on the worksheet to create a note, including single-word text. In an active text editor it inserts at the caret/replaces the selected text; on a formatted note it appends to the existing Markdown source. Pasting text into an empty equation uses that field as a note; in a committed equation it remains mathematical input. Pasted images always become independent image fields at the current field/last worksheet click, removing an unused empty placeholder. Pasting into the explicit Math.js/plot settings uses the normal input behavior.

## Markdown notes

Text fields display formatted Markdown when you leave the editor. Click a formatted note (or focus it and press Enter/F2) to edit the original source. Click outside or press Escape to show the formatting again. The unchanged Markdown source is saved in JSON.

Supported: `#` headings (levels 1–6), `**bold**`, `*italic*`, `~~strikethrough~~`, inline backtick code, fenced code blocks, `-` bullet lists, numbered lists, `>` quotations and `[label](https://example.com)` links. Blank lines separate paragraphs; single newlines remain line breaks. Raw HTML is displayed as text. Tables, nested lists, embedded Markdown images and full CommonMark compatibility are outside this small subset; paste figures as independent image regions. Links open in a new tab. Existing plain-text notes continue to work.

## Supported visual operators

Right-click an equation to open MathLive's simplified menu. **Insert** includes absolute value / complex modulus, nth root, logarithm with a base, real and imaginary parts, and bounded sum/product. Fill template placeholders with **Tab** to move between them. Font variants, text/background colors, decorations, and unsupported calculus insertions are omitted. Matrix editing, Copy, Paste, and LaTeX mode remain available.

You can also type `abs(-3)=`, `abs(3+4i)=`, `re(3+4i)=`, `im(3+4i)=`, and `mod(17,5)=` directly in the equation editor. These names become function operators automatically. `abs(z)` is the modulus of a complex number; `mod(a,b)` means integer modulo, not complex modulus.

Alphabetic shortcuts do not expand midway through a name: `sin`, `sinc`, and `sinRate` remain distinct identifiers. Type normal Math.js-style calls such as `sinc(x)=sin(x)/x`, `abs(-3)`, `sqrt(9)`, or `map(t,sin)`. Completed calls receive their graphical form when finished or when leaving the field; typing a final `=` also commits the notation. This avoids changing a name before you have finished typing it. Use explicit multiplication (`*`) between named variables.

`map(t,sin)` displays as `sin(t)` with an arrow over the whole call, while retaining `map(t,sin)` in the source. To insert its graphical template explicitly, type `map` and press **Tab**, enter the function name, press **Tab**, and fill the vector. Functions defined above, such as `sinc(x)=sin(x)/x`, work in `map(t,sinc)` and produce vectors usable by plots. The arrow is tagged worksheet notation for elementwise mapping; it does not change vector values or dimensions. Older worksheets using the earlier `map` template continue to load. Tab also commits other named templates such as `sqrt` or `abs`, and retains its unit-acceptance behavior.

Custom function typing and rendering rules are registered in `src/function-mappings.js`. Structured reverse conversion lives in `src/visual-operators.js`. Functions with no dedicated mathematical notation retain their Math.js names; new visual forms require an explicit reverse mapping and tests rather than guessing from their appearance.

| Visual operation | Settings → Math.js expression | Example result |
| --- | --- | --- |
| Natural logarithm | `log(100)` | `4.60517019` |
| Logarithm with a base | `log(8,2)` | `3` |
| Nth root | `nthRoot(27,3)` | `3` |
| Absolute value / complex modulus | `abs(3+4i)` | `5` |
| Real / imaginary part | `re(3+4i)` / `im(3+4i)` | `3` / `4` |
| Integer modulo | `mod(17,5)` | `2` |
| Bounded sum | `sumOver(k^2,k,1,3)` | `14` |
| Bounded product | `productOver(k,k,1,4)` | `24` |

Add a final `=` to display an answer. Unbased visual `log` and `ln` both mean the natural logarithm; use an explicit subscript for another base. Sum/product bounds are inclusive finite integers with step 1. The index is local, including when it has the same name as a worksheet variable. Parenthesize the sum/product body when it contains addition or subtraction. Empty sums/products return 0/1. Evaluation is limited to 5,000 total sum/product terms, including nested operators. Standard Math.js `sum(vector)` and `prod(vector)` also remain available. Incomplete operator templates show a field error and can be completed or repaired in Settings.

## Units

Equations contain no typed spaces. Type `5kg` (or `2*5kg`): when a supported unit suffix is recognized, a small **kg — Tab to accept unit** hint appears. Press **Tab** to accept it. The editor inserts a multiplication dot and shows the unit upright in teal. Before acceptance it is ordinary math input; an undefined unit-like name asks you to press Tab. If that name is already defined above, it remains a variable until you explicitly accept it as a unit. Shift+Tab and Tab without a unit suggestion keep their normal navigation behavior.

Examples: `5kg` → Tab, `10m` → Tab, `2*kg` → Tab. Compound quantities can be built with `*`, `/`, and powers, accepting each unit in turn, for example `5m` → Tab, `/s` → Tab, `^2`. Units use Math.js's registry, including common prefixed units such as `kg`, `km`, `cm`, `ms`, and `kN`. Names are case-sensitive (`N` for newtons). Space inserts a separator and the field remains an equation.

Powers work in either order: type `5m^2` then Tab, or type `5m`, press Tab, then type `^2`. Both mean **5·m²**, not (5·m)². To square the whole quantity, use parentheses around the quantity. As with other MathLive superscripts, press the right arrow to leave an exponent before continuing on the baseline.

Accepted units are stored in LaTeX with a semantic marker and evaluate as explicit `unit("kg")` calls. Unit arithmetic and dimensional checks use Math.js. Units can be assigned to variables and flow through the worksheet; scalar results display units in the same teal color with a multiplication sign. A variable named `m` and an accepted metre token can coexist. JSON preserves the accepted units. The raw Math.js editor retains direct Math.js unit syntax for advanced expressions and existing worksheets.

## Slider and radio variables

Use **Elements → Slider** for a continuous variable and **Elements → Selector** for radio-button choices. Hover and open the right **⚙ Variable settings** control to edit the variable name and settings. Names such as `a`, `theta`, `mass`, and `a_1` work. A control defines its variable at its position in worksheet order, just like an equation; put dependent equations and plots below it. A later definition with the same name replaces the earlier value.

A slider displays `a = 1`, `a ∈ [0, 10]`, and `Δa = 0.1`. Edit **Minimum**, **Maximum**, **Step Δ**, and **Current value**. Settings accept numeric Math.js expressions and variables defined above, such as `pi/10`. Values snap to the step grid anchored at the minimum and clamp to the allowed range. The variable is numeric, and moving the slider or pressing arrow keys recalculates later equations and plots immediately.

A radio variable displays its current assignment and membership in an option set, for example `b ∈ {1, 2, 3}`. Put one numeric expression per line in its options settings, including `pi/2` or references to earlier variables. Changing the option list resets selection to the first choice. Up to 30 options are supported.

Optional **Unit** settings such as `kg` or `m/s^2` attach physical units to the control's values; units appear in the assignment and range/set notation. Basic plots need numeric results, so convert a unit-bearing expression with Math.js `number(value,"unit")` when plotting it. Values, ranges, steps, units, and selected radio choices are saved in JSON. Controls support moving, resizing, group selection, deletion and red error outlines like other fields.

Example: create slider `a` with range 0–5 and step 0.1, then put `a^2=` in an equation and `a*sin(x)` in a plot below it. Moving the slider updates both. Add radio variable `b` with options 1, 2, 3 and use `a*b=` to see both controls contribute.

Every slider has **Play / Pause**. Play advances through its range by Δ, looping back to the minimum; turn off **Loop animation** in Variable settings to stop at the last step. **Frames per second** controls speed (1–30, default 10). Expensive worksheets may play more slowly. The slider track stays still and is disabled during playback; the current value and dependent equations/plots update. Pause to move the slider manually. Plot viewports remain fixed during animation.

To animate a vector, define it above the slider, for example `angles=0:0.1:2*pi`. In the slider settings, enter `angles` in **Values vector (optional)**. The slider then selects successive vector entries rather than using minimum/maximum/step. The notation shows the selected index k, starting at 1. The vector can contain 2–5000 finite numeric values, including uneven, repeated or decreasing values; single-row and single-column matrices work too. Clear this setting to return to a numeric range. An optional Unit applies to every selected numeric value. One animated variable can drive any number of later equations and plots.

Settings and the current position are saved in JSON; playback itself is not saved. Loading, Undo/Redo, or rerendering the worksheet leaves controls paused. Leaving the browser tab also pauses playback. Animation frames do not fill Undo history; a completed run is recorded as one value change unless you make other edits during playback.

## Basic plots

One series per line, using Math.js syntax:

```text
sin(x)
cos(x)
[0,1,2,3] ; [0,1,4,9]
```

Vector series use `X expression ; Y expression`, with equal-length flat numeric vectors (1–5000 values). Functions and vectors can refer to variables already defined above the plot. For parametric data, use `t=0:0.05:2*pi`, `X=map(t,cos)`, `Y=map(t,sin)` in earlier equations, then `X ; Y` as the series. Non-finite function samples break the line.

In **Plot settings**, each nonblank series has its own **Style** (Line, Markers, or Line + markers), **Marker** (circle, square, triangle, diamond, plus, cross), **Marker size** (2–24 px), and **Color**. The legend shows the same line/marker combination. These settings are preserved in JSON and Undo/Redo. A single point such as `[2];[3]` uses a circle marker by default; multi-point series keep the existing line default. Choose Markers for unconnected measured data.

Plots are coordinate viewports, not stretched pictures. Drag the lower-right grip: widening reveals more x coordinates and increasing height reveals more y coordinates, while mathematical units per pixel stay the same. The lower-left coordinate remains anchored during resizing. Functions automatically resample across the newly visible x range (241–2001 samples); vector series keep their original data.

Drag inside a graph with the left mouse button to pan both axes. Scale stays unchanged and the plot object stays in place; use its right move handle to move the object on the sheet. A pan gesture supports Undo. Hover over the graph and use the mouse wheel to zoom around the pointer. Wheel alone zooms both axes, Ctrl+wheel zooms only Y, and Shift+wheel zooms only X. Axis-only zoom turns off the equal-scale lock so the other axis remains unchanged. Scrolling outside a graph still scrolls the worksheet.

In **⚙ Plot settings**:

- **Equal axis scales** makes one x unit and one y unit the same physical size, so circles remain circular. Resizing preserves that scale.
- **Legend on left** displays colored entries based on the input series. Optional **Legend names** supply one custom name per series.
- **Plot title**, **X-axis label**, and **Y-axis label** add plain-text annotations, including unit labels such as `Time (s)`.
- **Fit data** resets the view to the configured X minimum/maximum and the data's Y bounds. Editing the series or initial X range also resets the view. Changing worksheet variables preserves your current zoom; click Fit data if you want to refit the new values.

Plot viewport, labels, legend and equal-scale settings are preserved in JSON. Grid spacing follows the coordinate scale. Advanced discontinuity detection is not implemented.

When a formula ends with `=`, long vector/matrix answers (more than 12 entries) are initially shown as `[…]`. Click **Show N values** beside the answer to expand it, or **Hide values** to collapse it. The **⋮ → Settings** settings also contain **Show long vector/matrix results**. The full value always remains available to downstream calculations and plots; only its display is collapsed. This display choice is saved in JSON.

## Small modules

| File | Responsibility |
| --- | --- |
| `src/main.js` | DOM regions, editing, dragging/resizing, clipboard and file controls |
| `src/engine.js` | ordered shared-scope evaluation and plot sampling |
| `src/model.js` | region defaults, starter loading and versioned JSON validation |
| `src/example.json` | default worksheet in the same format as Save JSON / Load JSON |
| `src/plot.js` | Canvas 2D rendering |
| `src/plot-view.js` | viewport scales, fitting, ticks and zoom geometry |
| `src/plot-ui.js` | plot settings, labels, legends, resize and wheel interaction |
| `src/editing.js` | math-to-text editing gestures and matching inline result rendering |
| `src/style.css` | absolute-positioned scrollable worksheet |
| `src/paper.css` | borderless paper and contextual editing controls |

MathLive fonts are copied locally by `vite.config.js`, so no font CDN is needed. The dependency lockfile pins the tested versions. The production bundle is relatively large because this minimal implementation includes the full math libraries.

## Demo boundaries

This is intended for local, trusted worksheets. Math.js evaluation runs on the browser's main thread; costly expressions can freeze the page. It is not an isolated execution service for adversarial expressions. The visual-to-ASCII adapter supports elementary algebra, not every LaTeX construct; use raw Math.js input for advanced syntax. JSON has a 30 MB load limit and 250-region limit. There is no symbolic algebra UI, dependency graph, collaboration, mobile touch scrolling during a drag, or SMath import/export. Next steps would be a bounded evaluation worker, autosave, richer formula translation and advanced plots.

Library references: [Vite](https://vite.dev/guide/), [Math.js expressions](https://mathjs.org/docs/expressions/parsing.html), [MathLive interaction](https://mathlive.io/mathfield/guides/interacting/).








To change the default worksheet, create it in the app, choose **Save JSON**, and replace src/example.json with the downloaded file. Commit and publish the change. The example is validated using the same loader as **Load JSON**.




### Native Math.js editing

Check **⋮ → Settings → Native Math.js** for a resizable monospace source editor. Enter adds a line; Ctrl/Cmd+Enter or leaving the editor calculates. Native source evaluates as Math.js expressions, with a separate teal read-only result underneath. Pending edits hide the previous answer. Copy selected source normally, or select result text to copy it. Source, mode and editor size are saved in worksheet JSON.

Switching back to graphical notation checks the expression structure and refuses conversions that cannot preserve its meaning. The settings source box also supports multiple lines and resizing; use Ctrl/Cmd+Enter or blur to calculate. The settings panel stays anchored while the equation grows and can be resized.

Native result visibility is controlled by **Show Math.js result** in Settings and saved with the field. Switching back to graphical notation does not add an answer; graphical answers require an explicit trailing `=`.

### Canvas, print guides and Contents

The canvas grows vertically as you scroll. At 100%, blank paper uses the available screen width; existing wide content remains accessible without moving it. Use the zoom percentage, +/−, or **Fit width** to adjust the view. **Previous screen / Next screen** move one visible canvas height independently of print boundaries.

**Print area** overlays repeating A4 portrait or landscape page outlines with 15 mm margin guides. Switching guides never moves fields or changes calculation order. **Print / PDF** opens the browser print dialog; choose Save as PDF there if needed. Guides, toolbars, selection frames and menus are excluded from printing. Place content within the desired page areas yourself; objects crossing a boundary may be split or clipped.

Open any element's **⋮ → Settings → Label / anchor (#Name)** and enter a label such as `#Example 1`. Its existing minimized label is the same property. **Contents** lists these markers in worksheet order, including expanded, minimized and collapsed elements. Blank text fields with a named anchor are retained. Clicking an entry preserves zoom and jumps to that element; a containing collapsed section is revealed, while a section targeted directly keeps its collapsed state. Previous/next anchor buttons and **Alt+PageUp / Alt+PageDown** navigate the list; keyboard navigation is inactive inside editors. The sidebar overlays the canvas, and on smaller screens closes after selecting an entry. Navigation never changes mathematical order.

Anchor labels, print-guide selection and zoom are saved in worksheet JSON. Older files remain supported. The vertical geometry limit is now 1,000,000 worksheet pixels; horizontal coordinates and image dimensions retain their existing limits. Existing file-size and field-count limits still apply.

**Print scale** (25–200%) is independent of screen zoom and saved with the worksheet. At 80%, each A4 guide covers 25% more worksheet width and height, while the printed content is reduced to 80%. Fonts and element positions on screen stay unchanged. Guides show the corresponding page breaks and physical 15 mm margins. Fit width explicitly fits the scaled guide width when guides are enabled. Older worksheets default to 100% print scale.

### Elements palette

The right-hand **Elements** button expands a stationary two-column palette: Math, Text, Picture, Plot, Slider, Selector, and Section. Selecting a tool waits for a click or tap on the canvas; the upper-left corner is placed there (sections use the full width). Escape, Cancel placement, or closing the palette cancels placement. The palette stays open for repeated use and does not change canvas zoom or layout. Picture asks for a file after placement, retaining that position. **Section around selection** is available when non-section fields are selected. The palette is hidden when printing. The insertion palettes are available.

### Greek palette

The right-hand **Greek** topic opens a compact six-column grid of 34 common lower- and uppercase Greek symbols. Select an equation or open a text note first. Clicking a symbol preserves the caret or selected range and inserts graphical notation into MathLive, the corresponding name (such as `theta`) into native Math.js or the Settings source editor, and the Unicode letter into a note. Buttons show symbol names in tooltips. Elements and Greek are mutually exclusive; both palettes stay clear of the scrollbar and are excluded from printouts. New sliders start at 280 px wide; existing saved or resized sliders retain their widths.

### Beginner Functions palette

The right-hand **Functions** topic opens a stationary 5 × 3 grid: square root, nth root, square, general power, absolute value, natural/base-10/arbitrary-base logarithms, exponential, pi, sine/cosine/tangent, bounded summation, and vector mapping. Tooltips show plain-language names and Math.js syntax. Select an expression to use it as the first argument, or insert into an empty equation and fill the placeholders. Tab navigates placeholders in graphical and native editors; Shift+Tab moves backward in native templates. Native source and the Settings source box receive Math.js syntax (`log(x,b)`, `nthRoot(x,n)`, `sumOver(expression,k,lower,upper)`, `map(vector,f)`). The palette requires a focused equation, stays open for repeated use, shares the dock with Elements and Greek, and is hidden for printing. Functions insert notation without forcing a calculation; the existing editor commit keys still apply.

### Units and physics constants palette

The **Units** topic provides ten accepted unit tokens: m, s, kg, N, J, W, Pa, Hz, V and A. They insert at the active graphical/native equation cursor; choosing a unit while a quantity is selected attaches the unit to that quantity. Explicit unit calls preserve meaning even if a worksheet variable has the same name. No Tab acceptance is needed for palette units.

A Physics constants group demonstrates six named Math.js values: `planckConstant`, `gravitationConstant`, `gravity`, `speedOfLight`, `elementaryCharge`, and `boltzmann`. G (the gravitational constant) and g₀ (standard gravity) are distinct. Constants retain their Math.js names and physical units; the palette does not define short aliases or paste numeric approximations. Tooltips show values supplied by the installed Math.js version, and **Browse more constants** links to its larger catalog.

### Document toolbar and title

Load, Save, Undo, Redo and Fullscreen use icons with tooltips in the canvas menu bar. The reduced-height header contains an editable worksheet title/topic. Titles are stored in JSON, restored on load, included in Undo/Redo, and used for suggested download filenames. Older files show their filename as the initial title. Plot properties scroll in one outer menu rather than nested scroll areas.

### Matrix & vectors palette

The **Matrix & vectors** topic contains 1D vectors, three-entry column vectors, 2×2 and 3×3 matrix templates, transpose, determinant, inverse, dot and cross products, vector norm, identity and zero matrices. Select an existing expression to use it as the first argument; Tab navigates cells and remaining arguments. Native editors receive explicit Math.js syntax. Operations use named functions (`transpose`, `det`, `inv`, `dot`, `cross`, `norm`, `identity`, `zeros`) so matrix operations retain their meaning when switching between native and graphical views. A 1D vector and a column matrix retain their distinct dimensions.
