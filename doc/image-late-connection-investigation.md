# Image late-connection investigation

## Status

An experimental implementation exists on branch
`agent/image-late-connection`. It deliberately retains the captured-error
architecture. It is not merged or released.

The current mechanism is a proof of concept. Its purpose is operational
transparency, not perfect concealment: UltimaDark temporarily intercepts an
image so it can inspect the image again after more DOM context is available,
while the website should otherwise continue working normally.

The captured-error mechanism was retained and hardened because the author
considers it viable. An alternative deferred-setter design remains recorded
below only as a possible comparison.

The Firefox bench is stored in
`other-tools-and-tests/benchs/imageLateConnection.js`.

## Google Images preview replacement

Google Images keeps its grid thumbnail in the preview and preloads a separate
full-resolution image while detached. It waits for that image's native
`load`/`decode()` result before inserting it and hiding the thumbnail. Waiting
exclusively for DOM insertion therefore deadlocks that sequence: Google waits
for the image to load, while UltimaDark waits for Google to insert the image.

After UltimaDark captures the deliberately invalid source's `error`, it now
restores the unedited source while the image is detached. The website receives
a genuine native `load` or `decode()` and can perform its insertion normally.
UltimaDark keeps weakly tracking the image and applies the contextual rewrite
when a private detached slot reports that the website moved its staged root.
No synthetic events, mutation observer, or general DOM insertion hooks are
needed.

The contextual rewrite can make the browser emit a second `load`. The website
already received the detached preload's native `load`, so UltimaDark captures
and suppresses this second implementation-only event. Reusing the same
detached image for another URL resets the state and begins a fresh
error/release/insertion cycle.

## Slot-based connection signal

The HTML Standard's internal image "relevant mutations" expose no JavaScript
callback for connection. Native Firefox and Chromium tests confirm that
inserting or moving an already-loaded detached image emits no additional
`load`, `error`, or decode notification.

Instead, UltimaDark temporarily places the top detached image root under a
private detached host with a closed shadow root and `slot`. The image remains
natively disconnected. Moving the staged root changes the slot assignment and
emits `slotchange`; UltimaDark then either stages the new top detached root or,
if it is connected, performs contextual recovery.

While staged, conditional topology accessors expose the root as genuinely
detached (`parentNode`/`parentElement` are null and `getRootNode()` returns the
staged root). Detached-only mutation methods remain no-ops. The facade stops
matching the root as soon as the website moves it. A narrow animation-frame
fallback handles a `DocumentFragment`, which cannot itself be parented without
splicing out its children.

## Observed symptoms

- Reddit sometimes displays an image's alternative text.
- Google Images sometimes keeps the preview image instead of the expected
  image.
- The late-connection path works in some cases but fails often enough to be
  unreliable.

## Current mechanism

In `image_element_prepare_href`, a non-connected image receives a temporary
source beginning with:

```text
data:text/ud-late-connection;
```

UltimaDark installs capturing image lifecycle listeners. When the temporary
source fails, the listener restores the raw source so the detached native
preload can complete. The private slot independently reports the later move;
contextual processing occurs only when the image is really connected.

The image `src` property getter hides the late-connection prefix. The mechanism
also replaces the image's `decode()` method so callers can wait for the restored
image.

Relevant implementation:

- `background.js`: `image_element_prepare_href`
- `background.js`: `valuePrototypeEditor`
- `websitesOverrideScript.js`: `HTMLImageElement.src` and `srcset` hooks

## Confirmed implementation defects

These problems are independent of whether the captured-error architecture is
kept.

The experimental branch addresses all defects listed in this section.

### Sibling images can receive the wrong source

Recovery iterates over all children of the triggering image's parent. For every
sibling with `src`, it derives the replacement from the triggering image's
`src`, rather than from that sibling's own source.

On image grids, one failure can therefore modify unrelated neighboring images.
Recovery should normally target the triggering image and explicitly associated
`picture`/`source` elements only.

### `srcset` recovery does not process candidates independently

The normal `srcset` setter parses and prepares each candidate separately.
Recovery instead passes the complete `srcset` value to
`image_element_prepare_href` as though it were one URL.

This can damage width/pixel-density descriptors and may explain preview
selection problems on Google Images. Recovery must parse, prepare, and rebuild
each candidate exactly like the normal setter.

### The `decode()` replacement has incomplete promise semantics

- Only one resolver is retained, so concurrent `decode()` calls can strand
  earlier promises.
- The own `decode` property is not removed after recovery.
- Calls made after the one-shot error handler has run can create promises that
  never resolve.

If the override is retained, it needs a resolver queue, defined lifecycle, and
restoration of the native method. Prefer native `decode()` semantics wherever
possible.

### The late marker is not hidden from every ordinary interface

The `src` property getter removes the prefix, but the temporary value remains
observable through interfaces such as:

- `getAttribute("src")`
- `currentSrc`
- `complete`
- `naturalWidth` and `naturalHeight`
- `MutationObserver`
- `srcset` and `source` state

Perfect concealment is not a goal. However, these values matter if ordinary
framework code uses them to decide whether to retain a preview, retry a load,
or render fallback content.

## Open architectural question: is captured error a valid connection gate?

An image can begin loading while detached. Consequently, the temporary URL's
`error` event proves that the temporary resource failed; it does not, by itself,
prove that the image is connected.

This creates a timing question that must be measured rather than assumed:

1. Is the image connected when the handler runs?
2. If it is still detached, does the current handler restore it too early?
3. If it is connected, can Firefox paint the broken-image/alternative-text
   state before recovery completes?
4. Do framework listeners or state checks run before UltimaDark restores the
   source?

The visible Reddit alternative text is consistent with Firefox briefly treating
the connected element as a broken image, but this does not yet prove that the
captured-error approach is unusable.

The branch treats failure and connection as two independent signals:

- a capturing image error records that the temporary resource failed;
- a private detached slot reports movement without intercepting DOM insertion
  APIs;
- recovery runs only after both conditions are true.

This also covers a temporary failure that occurs while detached and an
insertion that happens later inside an existing shadow root.

### Ways to retain and harden the captured-error design

- In the error handler, check `image.isConnected` instead of assuming
  connection.
- If still detached, postpone final recovery until actual connection while
  retaining the original requested values.
- Restore only the triggering image and its own responsive sources.
- Rebuild `srcset` candidate by candidate.
- Make recovery idempotent so repeated property updates cannot race.
- Preserve all pending `decode()` callers or avoid overriding `decode()`.
- Instrument event order, connection state, `currentSrc`, dimensions, and
  framework mutations in a dedicated bench.
- Test whether recovery can complete before a paint when the error fires on a
  connected image.

## Alternative design for comparison

A deferred-setter design could store requested values in a `WeakMap`, avoid
giving the native image setter an invalid temporary URL, and apply the final
source after actual connection.

This would require an explicit cancel/defer contract in `valuePrototypeEditor`,
because its current setter wrapper always calls the original native setter.

This alternative avoids a real broken-image state, but it is not automatically
the chosen solution. It should be compared against a corrected captured-error
implementation for compatibility, complexity, and timing.

## Recommended investigation bench

Build a page that records, for detached and connected images:

- `src`, `getAttribute("src")`, `srcset`, and `currentSrc`
- `complete`, `naturalWidth`, and `naturalHeight`
- capture- and bubble-phase `load`/`error` ordering
- one and multiple simultaneous `decode()` calls
- insertion by `append`, `appendChild`, `insertBefore`, `replaceChildren`, and
  `DocumentFragment`
- `<picture>` with multiple `<source>` candidates
- multiple sibling images with unrelated sources
- a low-resolution preview followed by a full-resolution source
- mutation-driven replacement similar to Reddit and Google Images
- whether fallback/alternative text becomes paint-visible

Run every case with image processing enabled and disabled, and compare:

1. the current implementation;
2. a corrected captured-error implementation;
3. a deferred-setter prototype.

The decision should follow those results rather than assuming that either
architecture is inherently correct.

## Experimental branch result

The current real-Firefox bench covers:

- failure while detached followed by document insertion;
- suppression of the temporary error from an ordinary website error listener;
- staged parent/root facade and detached mutation semantics;
- independent sibling images;
- responsive `picture` sources;
- concurrent `decode()` calls;
- native-load-gated Google-style insertion with one website-visible load;
- repeated detached preload generations;
- rapid source replacement;
- multi-step `DocumentFragment` construction without insertion hooks;
- multi-candidate image `srcset`;
- insertion into an existing shadow root;
- source-only responsive recovery inside a closed shadow root;
- tracker cleanup after recovery;
- confirmation that the mechanism creates no `MutationObserver` and leaves no
  active staging host after recovery.

All 16 cases pass in Firefox 140 ESR. The preceding captured-error architecture
was confirmed manually on Reddit and Google Images; the slot replacement still
needs the same production-site confirmation before release.
