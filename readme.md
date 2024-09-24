# UltimaDark
This repository stores the source code for the UltimaDark Firefox extension
The extension uses agressive techniques to get a dark mode everywhere on internet

### This is still highly experimental so it can also ruin your internet experience

UltimaDark stands out from other extensions in its category by altering colors even before the renderer (Gecko) processes them, which considerably improves performance. The UltimaDark code intercepts the page content at an early stage, right after it is fetched from the remote website. This preemptive editing prevents Gecko from displaying the default bright colors of the website before applying the dark theme, eliminating the jarring white flash during page loading.

During this initial edit, nothing has been parsed by Gecko yet — all values are still character strings. The challenge lies in identifying colors within these character strings and determining whether they will be used as background or foreground. This distinction is not an exact science, adding complexity to the process.

Once a color is detected, it undergoes the appropriate transformation, either darkening or brightening. After the transformation is complete, the original value is replaced in the character string, ready to be read by the renderer.

The adjustment of website colors, rather than implementing a dark theme, aims to preserve the authenticity of the website's intended design.

## Background Color Lightness Transformation Function

`Ultimadark` modifies the lightness of background colors, but it preserves the darkest 20% of background lightness values to respect the design intent of websites that already use dark themes. This ensures that the dark appearance of these sites remains unaltered.

For background lightness values above this threshold, a piecewise linear transformation is applied. The function operates as follows:

1. **Threshold (T):** Background lightness values below the 20% threshold remain untouched to maintain their intended design.
   
2. **Mid-point Maximum Lightness (A):** From the threshold (T) up to a lightness of 0.5, the function increases the lightness linearly. At 0.5, the saturation peaks, ensuring that the website design remains faithful but balanced with a new maximum lightness (A). This is the point where the saturation of colors is maximized, maintaining visual richness.

3. **Decreasing Lightness After 0.5:** Beyond the 0.5 lightness value, the function starts decreasing lightness gradually down to a minimum contrast value (B). The lightness never reaches zero. This is important because many web designs place white elements (lightness = 1) on black backgrounds. By preserving some contrast between these elements, the design remains legible and visually cohesive.

4. **Potential Fidelity at the Threshold (T):** While still under consideration, one idea is to ensure that the transformation starts at the exact original lightness when lightness equals the threshold (T). This would allow for a smoother transition from the original design, maintaining fidelity to the initial background's lightness, and avoiding abrupt visual shifts. However, this idea is still in development and has not been implemented, as it needs more advanced calculus. 

This approach maintains the balance between adapting websites for better readability and preserving the original design aesthetics, particularly on dark-themed websites.

You can review the transformation function here: [Desmos Background Transformation Function](https://www.desmos.com/calculator/2prydrxwbf)

## Text Lightening Transformation Function

`Ultimadark`  includes a text lightening transformation designed to progressively enhance readability while maintaining the original design aesthetics of a website. The function adjusts the lightness of text in a smooth and gradual manner, ensuring readability improvements without sharp or sudden changes that could disrupt the design’s balance.

1. **Maximum Lightness (B) at Lightness 0:** Starting with text that has a lightness of 0 (pure black), the function increases the lightness up to a predefined maximum value (B). Although (B) is not yet user-configurable, future versions of the function will allow users to set their preferred maximum lightness, providing greater flexibility in adjusting the readability of dark text.

2. **Saturation and Color Fidelity (A) and Break Point at 0.5:** As text moves from darker shades toward mid-tones, the function progressively lightens the text while carefully preserving saturation and color fidelity. The function reaches a break point at a lightness of 0.5, where saturation is at its peak.

3. **Maintaining Bright Text within B:** For text that is already close to white (lightness values above 0.5), the function ensures that the lightness remains accurate, in the respect of the user upper limit of the maximum lightness value (B), ensuring that even bright text remains visually balanced and readable. This progressive adjustment keeps text within the desired contrast range while maintaining harmony with the overall design. The configurability of (B) is planned, allowing users more control over the upper limits in future versions.

 and here [Desmos Foreground Transformation Function](https://www.desmos.com/calculator/37yi1rirw9).

UltimaDark also has the capability to edit pixels in images ("Image Edition" toggle), although this feature is currently experimental and not fully functional. An example of the broken functionality can be seen on the Apple support page: [Broken Example](https://support.apple.com/fr-fr/HT205189). On the other hand, the feature works better on the Sushi Spirit website: [Not-So-Bad Example](https://www.sushispirit.com/).

# Compatibility
### Desktop platforms: 
- Currently running on Firefox [115.0.3 ESR](https://ftp.mozilla.org/pub/firefox/releases/115.0.3esr/) and [higher](https://www.mozilla.org/firefox/new/)
- [Mercury](https://thorium.rocks/mercury)
- [Waterfox G6.0.7 or higher](https://www.waterfox.net/) 
- [LibreWolf](https://librewolf.net/)
- [Floorp](https://floorp.app/en/)

# Versions

 Currently on 1.5.x
# Downloads
 [Download from AMO](https://addons.mozilla.org/firefox/addon/ultimadark/) (Firefox's add-on repository)

# How To Clone

```
git clone https://github.com/ThomazPom/Moz-Ext-UltimaDark
````
# Prerequisite

- No script has to be executed
- Any Gecko based browser that maintains current Firefox WebExtension support on it's respective platform

# Bug Reporting 

Bug reports help developers to find out about issues they may not have experienced - it is impossible to test an extension synthetically in every way that users will. 

- Please make sure you are testing on the latest verison of the extension by manually checking for updates from the "manage extensions" page or verifying the version number against the most recent merge. 
- Search for the site name on the issue tracker to make sure it has not already been reported 
- Disable other extensions that may be interfering with the layout of the site eg. content blockers before testing
- Take screenshots of the behavior and specify what Browser, Release Channel, and Version you are on along with providing a link to the offending site 
- Please do not post bug reports only affecting Android as it is unsupported and has been enabled in AMO for experimental testing purposes only (see wiki and closed issues for details) 

# Backporting 

Without an unreasonable level of effort, this extension will not be compatible with Pre-Quantum versions of Firefox (56 and lower). However, it should be theoretically possible to get working on 57 and higher (excluding the ImageEdition rewrite which requires Firefox 105 or above). Contributions towards this broader compatibility would be greatly appreciated. 
