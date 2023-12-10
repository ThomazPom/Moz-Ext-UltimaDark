# UltimaDark
This repository stores the source code for the UltimaDark Firefox extension
The extension uses agressive techniques to get a dark mode everywhere on internet
This is still highly experimental so it can also ruin your internet experience

UltimaDark stands out from other extensions in its category by altering colors even before the Firefox renderer processes them. The UltimaDark code intercepts the page content at an early stage, right after it is fetched from the remote website. This preemptive editing prevents the renderer from displaying the default bright colors of the website before applying the dark theme, eliminating the jarring white flash during page loading.

During this initial edit, nothing has been parsed by the Firefox renderer yet—all values are still character strings. The challenge lies in identifying colors within these character strings and determining whether they will be used as background or foreground. This distinction is not an exact science, adding complexity to the process.

Once a color is detected, it undergoes the appropriate transformation, either darkening or brightening. After the transformation is complete, the original value is replaced in the character string, ready to be read by the renderer.

The adjustment of website colors, rather than implementing a dark theme, aims to preserve the authenticity of the website's intended design.

Let's focus specifically on the darkening transformation, as there are still refinements to be made in the brightening function.

**²** The darkening transformation begins by determining the lightness of the color. If it falls below a certain brightness threshold (B), it remains untouched, respecting the website's intended design.

For lightness values above B, the edit ensures it never exceeds a maximum lightness (A). The lightness scale ranges from 0 to 1, where 0 is black and 1 is fully white—unsuitable for a background.


- Lightness values from 0 to B are preserved as-is.
- Lightness values from B to 0.5 are scaled from B to A.
  -  It might be a good option to shortcut this rule for lightness from B to A ( Do not edit site colors which are already under maximum  lightness A, thus keeping exactly these intended colors as is)
- Lightness values from 0.5 to 1 are reversed and then scaled from A to B. 
  - This implies lightness values of 1 (white) are then equals to B (not reversed to black !), ensuring good contrast with colors at point ².

You can review the transformation function here: [Desmos Transformation Function](https://www.desmos.com/calculator/oqqi9nzonh).

UltimaDark also has the capability to edit pixels in images, although this feature is currently experimental and not fully functional. An example of the broken functionality can be seen on the Apple support page: [Broken Example](https://support.apple.com/fr-fr/HT205189). On the other hand, the feature works better on the Sushi Spirit website: [Not-So-Bad Example](https://www.sushispirit.com/).

# Compatibility
- Firefox Quantum 48+

# Versions

- 1.0
# Downloads
- [Download with firefox](https://addons.mozilla.org/fr/firefox/addon/UltimaDark/)

# How To Clone

```
git clone https://github.com/ThomazPom/Moz-Ext-UltimaDark
````
# Prerequisite

- No script has to be executed
- You only need Firefox installed on any platform
