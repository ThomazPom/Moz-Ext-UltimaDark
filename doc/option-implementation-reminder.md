# Reminder: implementing a new option correctly

Use this checklist when adding a persisted UltimaDark option. It records the general lessons from implementing the optional foreground-border behavior, but the workflow applies to any future option. A setting is complete only when its default, popup state, storage, synchronization, runtime export, application logic, generated files, and upgrade behavior agree.

## 1. Define the canonical setting

Add the setting to `uDark.userSettings` in `background.js`.

- Choose a descriptive name with the same style as existing settings.
- Give it a safe default. Features that materially alter rendering should normally be opt-in.
- `defaultSettings` is derived from `userSettings`, so the setting will also participate in reset, import validation, and update migration.
- Scalar settings are automatically included in Firefox Sync through `syncableSettingsKeys`, unless explicitly listed as local-only or list-valued.

Example:

```js
foregroundBordersEnabled: false
```

## 2. Decide whether the setting must reach page worlds

If code running in a content or page context reads the setting, add its key to `uDarkC.safeExportKeys`.

Only propagate the setting value. Each runtime loads the application code and should autonomously interpret the setting using its own constants and property lists. Do not propagate derived arrays or duplicate application state across compartments.

The existing modern and legacy injection paths already transfer `getSafeUserSettings(...)`; they should not need option-specific edits.

## 3. Add popup state

Add the same key and default to `popup/modules/store.js`.

The existing store infrastructure then handles:

- loading through `uDark.getSettings`;
- saving through the `Object.keys(uDark.userSettings)` loop;
- local storage;
- Firefox Sync when enabled;
- reset and import behavior.

Avoid adding custom persistence code unless the setting has genuinely different storage semantics.

## 4. Add the control in the appropriate UI section

Choose placement based on what the option represents, not merely which internal values it affects.

- Feature switches belong in the main feature-toggle section.
- Numeric transformation parameters belong in the color/text/background controls.
- Match the visual language of neighboring controls.

For a feature toggle, use the established ENABLED/DISABLED card pattern:

- green enabled state;
- red disabled state;
- a short label;
- explanatory text below;
- both buttons call the existing `saveSettings()`.

## 5. Keep runtime application autonomous

Read the propagated boolean where the behavior is selected:

```js
if (
  uDark.userSettings.foregroundBordersEnabled &&
  uDark.foreground_border_properties.includes(originalProperty)
) {
  foregroundComplexItems.push(property);
}
```

Keep developer-maintained property groups separate when they have different meanings:

```js
foreground_color_css_properties = ["color", "caret-color"]
foreground_complex_color_css_properties = []
foreground_border_properties = [/* explicit allowlist */]
```

Prefer a flat allowlist when the supported CSS properties are finite and stable. It is easier to audit and avoids accidentally matching unrelated properties such as `border-radius`, `border-width`, `border-style`, or `border-image`.

## 6. Respect shorthand protection

UltimaDark temporarily renames CSS shorthands to `--ud-ptd-*` custom properties before parsing. This prevents `CSSStyleDeclaration` from expanding a shorthand into longhands and changing its structure.

Classify a protected declaration using its original name, but continue editing its protected key:

```js
const originalProperty = property.startsWith("--ud-ptd-")
  ? property.slice("--ud-ptd-".length)
  : property;
```

The existing unprotection later restores the original property name.

## 7. Choose the correct color-editing path

`fastValue0` is suitable only when the complete property value is one color, such as:

```css
color: red;
```

Do not use it for complex shorthands or multi-color values:

```css
border: 1px solid red;
border-color: red green blue yellow;
```

Send those properties through the normal token-scanning path so only color tokens are transformed and widths/styles remain intact.

## 8. Rebuild generated popup assets

After changing popup JavaScript, rebuild from `popup/`:

```sh
npm ci
npm run build
```

Commit the generated `popup/bundle.js` and `popup/bundle.js.map` when they change. HTML-only changes do not alter the bundle, but running the build verifies that source and generated output remain consistent.

## 9. Verify before committing

At minimum:

```sh
node --check background.js
node --check backgroundClass.js
node --check contentScriptClass.js
node --check popup/modules/store.js
git diff --check
```

Also verify:

- the default is identical in background and popup state;
- the key appears in `safeExportKeys` when page-side code needs it;
- enabling and disabling take the intended branches;
- protected and unprotected CSS property names classify identically;
- complex declarations do not use `fastValue0`;
- excluded properties remain on their original path;
- the popup bundle rebuild succeeds;
- only intended files are staged.

## Worked example: optional foreground-border classification

The `foregroundBordersEnabled` implementation demonstrates the general checklist:

- default: `false`;
- UI: feature-toggle card near Image processing;
- propagation: only the boolean through existing settings infrastructure;
- local runtime data: an explicit `foreground_border_properties` allowlist;
- shorthand compatibility: classify `--ud-ptd-border` as `border`;
- transformation: complex foreground token scanning;
- exclusions: radius, width, style, and image-related border properties.

For a different option, reuse the lifecycle and architectural decisions rather than copying the border-specific property lists or transformation path. Determine independently whether that option is scalar or list-valued, local-only or synchronized, background-only or page-visible, simple or complex to apply, and whether it needs generated assets rebuilt.
