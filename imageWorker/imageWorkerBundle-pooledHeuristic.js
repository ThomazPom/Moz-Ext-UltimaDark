// --- BEGIN imageWorkerHeuristic.js ---
console.time('load:imageWorkerHeuristic.js');


console.log("Image Service worker started")

/**
* High-performance color & lightness statistics subsystem
* -------------------------------------------------------
* Goal: Collect rich per-image metrics (distinct colors, lightness diversity, opacity stats)
* in a SINGLE linear pass over RGBA pixels with minimal memory & CPU overhead.
*
* Why a 24-bit RGB bitset?
*  - Full RGB space = 256^3 = 16,777,216 possible colors.
*  - A naive boolean array of length 16,777,216 would require 16,777,216 bytes (~16MB) if using Uint8Array.
*  - A Set<string> (e.g. "r,g,b") per color would allocate many JS objects & strings → high GC pressure & hash cost.
*  - Our bitset packs 8 color presence flags per byte: 16,777,216 bits / 8 = 2,097,152 bytes (~2MB).
*  *
* Performance characteristics:
*  - Each pixel costs O(1) constant work: arithmetic + 1 memory read + 1 masked write (only if new color).
*  - Memory access is highly cache-friendly (sequential iteration of source; random access in bitset but stable indices).
*  - Branch prediction: The hot branch "if (bit not set)" usually fails after initial warm-up in areas of repeated colors.
*  - No object allocation per pixel → avoids GC churn, enabling smooth processing even for large images.
*  - Lightness diversity uses a fixed 256-byte array (seenLightness) → extremely fast, fits in L1 cache.
*
* Future optimization pathway (if memory constraints tighten):
*  - Quantize non-opaque colors to 5 bits/channel (32 levels) → 32^3 = 32,768 colors → 4,096 bytes (≈4KB bitset).
*  - Keep opaque full resolution for precision; downsample only the non-opaque.
*  - Early bailout: we could stop tracking new colors once diversity exceeds a threshold relevant to classification.
*
* Why not RGBA indexing? 256^4 = 4,294,967,296 possibilities (requires 512MB bitset) → impractical.
* We collapse alpha dimension logically into two categories: fully opaque & not fully opaque.
*
* Concurrency notes:
*  - These typed arrays are worker-local; no shared memory race issues.
*  - Reset per image with .fill(0) (fast path in modern JS engines; may use memclr).
*
* Invariants:
*  - Bitset index = (r << 16) | (g << 8) | b (unique RGB mapping 0..16,777,215).
*  - Opaque pixels increment opaqueCount; semi-transparent increment nonOpaqueCount.
*  - Diversity counters only increment on first time a bit flips from 0→1.
*/
const COLOR_BITSET_SIZE = 1 << 24;                  // 16,777,216 possible RGB colors
const COLOR_BITSET_BYTES = COLOR_BITSET_SIZE >>> 3; // 2,097,152 bytes per bitset (~2MB)
const uDarkColorBitsets = {
    opaque: new Uint8Array(COLOR_BITSET_BYTES),     // Tracks presence of fully opaque colors (a == 255)
    nonOpaque: new Uint8Array(COLOR_BITSET_BYTES)   // Tracks presence where alpha < 255 (alpha ignored for indexing)
};
function uDarkResetColorBitsets() {
    // Fast blanket reset; Uint8Array.fill is optimized natively.
    uDarkColorBitsets.opaque.fill(0);
    uDarkColorBitsets.nonOpaque.fill(0);
}
function uDarkColorBitsetSetIfNew(kind, r, g, b) {
    // Convert RGB to linear bit address. This arithmetic is cheaper than hashing a string.
    const arr = uDarkColorBitsets[kind];
    const idx = (r << 16) | (g << 8) | b; // 24-bit RGB index (0..16,777,215)
    const byteIndex = idx >>> 3;          // Divide by 8
    const bitMask = 1 << (idx & 7);       // Select bit inside the byte
    const current = arr[byteIndex];
    if ((current & bitMask) === 0) {      // Test bit; branch predicts "already seen" after initial color spread
        arr[byteIndex] = current | bitMask; // Set bit (idempotent); write only on new color → reduces memory traffic
        return true; // Newly seen color
    }
    return false; // Already recorded
}

var uDark = {

    background_match: /background|sprite|widget|theme|(?<![a-z])(bg|box|panel|fond|fundo|bck)(?![a-z])/i,
    logo_match: /nav|avatar|logo|icon|alert|notif|cart|menu|tooltip|dropdown|control/i,
    non_logo_match:/widget|theme|(?<![a-z])(box|panel|fond|fundo|bck)(?![a-z])/i,
    ignore_match: /maps_/i,
    RGBToLinearLightness: (r, g, b) => {
        return (Math.max(r, g, b) + Math.min(r, g, b)) / 2;
    },
    getPerceivedLightness_approx(r, g, b) {
        return (0.299 * r + 0.587 * g + 0.114 * b);
    },
    trigger_ratio_size_number_colors: 393,
    trigger_ratio_size_number_lightness_photo: 9835,

    isGrayscale: (targetBitmap, tolerance = 4) => {
        console.log(targetBitmap, targetBitmap.width, targetBitmap.height, "isGrayscale");
        const canvas = new OffscreenCanvas(targetBitmap.width, targetBitmap.height);
        const ctx = canvas.getContext('2d',/* {willReadFrequently:true} is a exiting option, but needs benchmarking */);
        ctx.drawImage(targetBitmap, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            let vmax = Math.max(r, g, b);
            let vmin = Math.min(r, g, b);
            if (vmax - vmin > tolerance) {
                return false;
            }
        }
        return true;
    },

    check_image_lines_content: function (canvas, ctx) {
        const leftBorderImageData = ctx.getImageData(0, 0, 1, canvas.height);
        const rightBorderImageData = ctx.getImageData(canvas.width - 1, 0, 1, canvas.height);
        const topBorderImageData = ctx.getImageData(0, 0, canvas.width, 1);
        const bottomBorderImageData = ctx.getImageData(0, canvas.height - 1, canvas.width, 1);
        const centerVerticalLineImageData = ctx.getImageData(canvas.width / 2, 0, 1, canvas.height);
        const centerHorizontalLineImageData = ctx.getImageData(0, canvas.height / 2, canvas.width, 1);
        let linesAchromatic = Array(10).fill(false);
        let linesGradient = Array(10).fill(false);
        let linesAchromaticCount = 0;
        let linesAchromaticOpaqueCount = 0;
        let linesGradientsCount = 0;
        let list_test = [leftBorderImageData, rightBorderImageData, topBorderImageData, bottomBorderImageData, centerVerticalLineImageData, centerHorizontalLineImageData]
        for (let i = 0; i < list_test.length; i++) {
            let imageData = list_test[i];
            let theImageDataBufferTMP = new ArrayBuffer(imageData.data.length);
            let theImageDataClamped8TMP = new Uint8ClampedArray(theImageDataBufferTMP);
            theImageDataClamped8TMP.set(imageData.data);
            let theImageDataUint32TMP = new Uint32Array(theImageDataBufferTMP)
            let number = theImageDataUint32TMP[0];
            var r = number & 0xff;
            var g = (number >> 8) & 0xff;
            var b = (number >> 16) & 0xff;
            var a = (number >> 24) & 0xff;
            if (theImageDataUint32TMP.every(x => x == number)) {
                linesAchromatic[i] = [r, g, b, a]
                linesAchromaticCount++;
                if (a == 255) {
                    linesAchromaticOpaqueCount++;
                }
            }
            let isGradient = true;
            let currentLightness = Math.max(uDark.getPerceivedLightness_approx(r, g, b), a);
            for (let n = 1; n < theImageDataUint32TMP.length; n++) {
                // Start to 1 as we already checked the first pixel
                number = theImageDataUint32TMP[n];
                r = number & 0xff;
                g = (number >> 8) & 0xff;
                b = (number >> 16) & 0xff;
                a = (number >> 24) & 0xff;
                let lightness = Math.max(uDark.getPerceivedLightness_approx(r, g, b), a);
                if (lightness > currentLightness + 5 || lightness < currentLightness - 5) {
                    isGradient = false;
                    break;
                }
                currentLightness = lightness;
            }
            if (isGradient) {
                linesGradient[i] = true;
                linesGradientsCount++;
            }
        }
        return {
            linesAchromaticCount,
            linesGradient,
            linesAchromaticOpaqueCount,
            linesAchromatic,
            linesGradientsCount,
            linesWithSomeAlpha: linesAchromaticCount - linesAchromaticOpaqueCount,
            linesFullAlphaCount: linesAchromatic.filter(x => x[3] == 0).length
        }

    },
    logo_image_edit_hook: function (editionStatus, canvas, ctx, img, blob, details, imageURLObject, complement) {

        let perf_start = performance.now();
        console.log("Logos", "Entering edition", details.url, details.requestId)

        let editionConfidence = 0 + (editionStatus.editionConfidenceLogo);
        // Draw the image onto the canvas
        ctx.drawImage(img, 0, 0);
        uDark.calcStatsNoRun(editionStatus, ctx, canvas, details);
        if (editionStatus.is_photo) {
            return false;
        }

        const imageData = editionStatus.imageData;

        const theImageDataClamped8TMP = editionStatus.theImageDataClamped8TMP;

        if (!(editionConfidence >= 100) && editionStatus.monoChromatic !== true) {
            if (editionStatus.alpha_percent < 0.1) {
                return false; // No enough alpha to be an editable logo
            }
            let max_bright_trigger = 255 * 0.4;
            if (editionStatus.min_lightness > max_bright_trigger) {
                return false; // This is a bright image with which does not need lightening, because even the darkest pixel is bright enough
            }
            if (editionStatus.contrast_percent > .70) {
                // ADD SHADOW TO IMAGE PARTS WITH LIGHTNESS < 30
                // Note 30 is < 100-70 there is no conflict with the previous condition

                const theImageDataUint32TMP = new Uint32Array(theImageDataClamped8TMP.buffer);
                let n = theImageDataUint32TMP.length;

                imgDataLoop: while (n--) {
                    var number = theImageDataUint32TMP[n];
                    var r = number & 0xff;
                    var g = (number >> 8) & 0xff;
                    var b = (number >> 16) & 0xff;
                    var a = (number >> 24) & 0xff;
                    let lightness = (Math.max(r, g, b, 255 - a) + Math.min(r, g, b, 255 - a)) / 2;
                    // lightness=Math.min(lightness); // Alpha kills lightness
                    if (lightness < 25) {
                        number = 0xffffffff;
                    }
                    else {
                        number = 0x00000000;
                    }
                    theImageDataUint32TMP[n] = number;
                }
                imageData.data.set(theImageDataClamped8TMP);
                ctx.putImageData(imageData, 0, 0);
                ctx.filter = "blur(3px)";
                let resource = canvas;
                let options = { viaBitmap: false, repetitions: 5 };
                if (options.viaBitmap) {
                    resource = canvas.transferToImageBitmap();
                }
                for (let i = 0; i < options.repetitions; i++) {
                    ctx.drawImage(resource, 0, 0);
                }
                ctx.filter = "none";
                ctx.drawImage(img, 0, 0);
                editionStatus.edited = true;
                return true;
            }
            // Apply some modifications to the imageData
        }

        // Now you can work with the imageData object
        // console.log(imageData, img.src);

        // The imageData object has a data property, a Uint8ClampedArray containing the color values of each pixel in the image.
        // It is easier to work with this array as 32-bit integers, but we max out performance and we can avoid some overhead by working with the original array directly.


        let lightenUnder = 127;
        for (let i = 0; i < theImageDataClamped8TMP.length; i += 4) {
            let r = theImageDataClamped8TMP[i];
            let g = theImageDataClamped8TMP[i + 1];
            let b = theImageDataClamped8TMP[i + 2];
            let lightness = uDark.getPerceivedLightness_approx(r, g, b);
            // lightness = Math.min(a,lightness);
            let pushValue = lightenUnder - lightness;
            if (lightness < lightenUnder) {
                r = r + pushValue;
                g = g + pushValue;
                b = b + pushValue;

                theImageDataClamped8TMP[i] = r;
                theImageDataClamped8TMP[i + 1] = g;
                theImageDataClamped8TMP[i + 2] = b;
            }



        }


        // Pro tip Reset the image at any time : theImageDataClamped8TMP.set(imageData.data);

        console.log("Logos", details.url, details.requestId, "Logo edited in", performance.now() - perf_start);
        imageData.data.set(theImageDataClamped8TMP);

        ctx.putImageData(imageData, 0, 0);

        console.log("Logos", details.url, details.requestId, "Put back in context", performance.now() - perf_start);
        editionStatus.edited = true;
        editionStatus.heuristic = "edited_logo"

        return true;



    },
    // Luma entière rapide (0..255) ~ 0.2126R + 0.7152G + 0.0722B
    // 54/256 ≈ 0.211, 183/256 ≈ 0.715, 19/256 ≈ 0.074
    luma8_fast(r, g, b) {
        return ((54 * r + 183 * g + 19 * b) >>> 8); // >>> 8 = /256
    },

    calcStatsNoRun(editionStatus, ctx, canvas, details) {
        // Core statistics routine. Single pass design philosophy:
        //  - Avoid multiple traversals (no separate grayscale or alpha passes).
        //  - Fuse: grayscale check, lightness diversity, alpha metrics, color uniqueness.
        //  - Minimize per-iteration work; avoid function calls inside the pixel loop.
        //  - Everything derived from raw RGBA stream with simple arithmetic & typed array ops.
        if (editionStatus.statsComplete) {
            // Stats already computed; no need to copy or recompute.
            return;
        }

        // Bitmap de lightness (0–255)
        const seenLightness = new Uint8Array(256); // Fits in L1; zero-init is implicit.
        let lightnessDiversity = 0;
        // Reset both bitsets before processing this image (constant time relative to array size; optimized native impl).
        uDarkResetColorBitsets();
        let opaqueCount = 0;
        let opaqueDiversity = 0;       // Distinct fully opaque colors
        let nonOpaqueCount = 0;
        let nonOpaqueDiversity = 0;    // Distinct semi-transparent colors

        const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
        const out = imageData.data; // Direct reference: avoid full duplicate buffer
        editionStatus.theImageDataClamped8TMP = out; // For editing hooks reuse same backing store
        editionStatus.imageData = imageData;
        let isGrayscale = true;
        let lightness_sum = 0;
        let opaqueLightness_sum = 0;
        let opaqueColor_qty = 0;
        let alpha_sum = 0;
        let alpha_qty = 0;
        let max_lightness = -Infinity;
        let min_lightness = +Infinity;
        let N = out.length >>> 2; // nombre de pixels dans l'image ( = out.length / 4 )
        for (let i = 0; i < out.length; i += 4) {
            // Hot loop: Do not introduce extra function calls or complex branching.
            // Memory pattern: sequential read from 'out', random-write into bitsets (low collision cost).
            // The bitset update's branch becomes predictable once local region colors saturate.



            let r = out[i], g = out[i + 1], b = out[i + 2], a = out[i + 3]; // Direct indexed access faster than destructuring.
            if (isGrayscale) {
                isGrayscale = (r === g) && (r === b);

            }
            // Luma rapide 0..255
            const L = uDark.luma8_fast(r, g, b);    // Fast integer approx; cheaper than floating formula.
            const Lvis = L < a ? L : a;             // Treat transparency as reducing effective visible lightness.
            if (!seenLightness[Lvis]) {              // First encounter of this lightness bucket.
                seenLightness[Lvis] = 1;
                lightnessDiversity++;
            }
            if (a === 255) {                        // Opaque pixel branch
                opaqueCount++;
                if (uDarkColorBitsetSetIfNew('opaque', r, g, b)) opaqueDiversity++;
            } else {                                 // Semi-transparent pixel branch
                nonOpaqueCount++;
                if (uDarkColorBitsetSetIfNew('nonOpaque', r, g, b)) nonOpaqueDiversity++;
            }
            lightness_sum += Lvis;
            alpha_sum += a;
            if (a < 255) { alpha_qty++; } else { opaqueColor_qty++; opaqueLightness_sum += L; }

            if (Lvis > max_lightness) max_lightness = Lvis;
            if (Lvis < min_lightness) min_lightness = Lvis;
        }
        const contrast = max_lightness - min_lightness;

        Object.assign(editionStatus, {
            avg_ligtness: lightness_sum / N,
            alpha_percent: alpha_qty / N,
            contrast,
            contrast_percent: contrast / 255,
            max_lightness,
            min_lightness,
            opaqueLightness_avg: opaqueColor_qty ? (opaqueLightness_sum / opaqueColor_qty) : 0,
            statsComplete: true,
            lightnessDiversity,
            opaqueCount,
            opaqueDiversity,
            opaqueDiversityRatio: opaqueCount ? (opaqueDiversity / opaqueCount) : 0,
            nonOpaqueCount,
            nonOpaqueDiversity,
            nonOpaqueDiversityRatio: nonOpaqueCount ? (nonOpaqueDiversity / nonOpaqueCount) : 0,
            combinedDistinctColors: opaqueDiversity + nonOpaqueDiversity,
            monoChromatic: opaqueDiversity <= 1,
            isGrayscale,
            isGrayscaleDiv: isGrayscale ? 3 : 1,
            pixelCount: N,

        });
        editionStatus.is_photo = !editionStatus.iaEnabled &&
            editionStatus.pixelCount / editionStatus.opaqueDiversity <= this.trigger_ratio_size_number_colors / editionStatus.isGrayscaleDiv
            && editionStatus.pixelCount / editionStatus.isGrayscaleDiv / editionStatus.combinedDistinctColors <= this.trigger_ratio_size_number_lightness_photo
            && editionStatus.opaqueDiversity / editionStatus.opaqueCount / editionStatus.isGrayscaleDiv > 0.4;
        // smart is photo given all statswe collected;
        // Note: is_photo heuristic uses ratios N/opaqueDiversity & N/lightnessDiversity.
        // Lower ratios → many distinct colors & lightness levels relative to size → typical of photographic content.
        // Adjustment for grayscale (divide threshold by 3) avoids misclassifying sparse-color logos as photos.
        editionStatus.isContrastBright = editionStatus.contrast_percent > .77 && editionStatus.avg_ligtness > 215 && editionStatus.max_lightness >= 204

        editionStatus.cantBeAnnoyingBG = editionStatus.avg_ligtness * Math.pow(editionStatus.contrast_percent, 2) < 166
        // editionStatus.isContrastBright = editionStatus.contrast_percent*editionStatus.avg_ligtness > 173 && editionStatus.max_lightness >= 204;  // Alternative formula
        // editionStatus.is_photo = false; // Disable photo detection for now
        console.log("Image", "calcStatsNoRun", editionStatus, details.url, details.requestId, N / opaqueDiversity, N)


    },





    background_image_edit_hook: async function (editionStatus, canvas, ctx, img, blob, details, imageURLObject, complement) {
        let editionConfidence = 0 + (editionStatus.editionConfidenceBackground);
        let perf_start = performance.now();
        console.log("Background", "Entering edition", details.url, details.requestId)

        if(complement.has("inside_clickable")){
            editionConfidence -= 50;
        }
        // Refuse bacground images on certain conditions

        if (!uDark.disableBackgroundPostCheck) {
            if (
                complement.has("width") && !complement.get("width").includes("%") && complement.get("width").startsWith(img.width) // We fetched the image with the same size as the element
                ||
                complement.has("height") && !complement.get("height").includes("%") && complement.get("height").startsWith(img.height) // We fetched the image with the same size as the element
            ) {
                return false;
            }


            if (complement.has("uDark_backgroundRepeat") && /repeat|round|space/i.test(complement.get("uDark_backgroundRepeat").replaceAll("no-repeat", "")) ||
                complement.has("alt") && /background/i.test(complement.get("alt"))

            ) {
                editionConfidence += 200;
            }


        }

        // Draw the image onto the canvas
        ctx.drawImage(img, 0, 0);
        uDark.calcStatsNoRun(editionStatus, ctx, canvas, details);
        if (editionStatus.is_photo) {
            return false;
        }

        if (!editionStatus.isContrastBright && editionConfidence < 100 && editionStatus.monoChromatic !== true) {

            if (editionStatus.alpha_percent > 0.1 && !(editionStatus.alpha_qty * 2 > editionStatus.pixelCount)) {
                editionStatus.heuristic = "too_much_alpha_for_background"
                return false; // Not a background : Too much pure alpha pixels
            }
            if(editionStatus.avg_ligtness<20){
                editionStatus.heuristic = "too_dark_background_already"
                return false; // If its already a very dark background, no need to darken it more
            }
            let min_bright_trigger = 255 * 0.4;
            if (editionStatus.avg_ligtness < min_bright_trigger && editionStatus.max_lightness < min_bright_trigger) {
                editionStatus.probable_dark_background_having_contrast = true;
                editionStatus.heuristic = "dark_background"
                return false; // If its a background, i'ts already a dark one, and it has no contrast elements, no need to darken it more
            }
            if (editionStatus.contrast_percent > .45 && editionStatus.avg_ligtness > 127 || editionStatus.contrast_percent > .60) {
                editionStatus.heuristic = "contrast_background"
                return false; // This image is bright but seems to have contrast elements, if we darken it we will loose these elements
            }
        }

        // Now you can work with the imageData object
        // console.log(imageData, img.src);

        // The imageData object has a data property, a Uint8ClampedArray containing the color values of each pixel in the image.
        // It is easier to work with this array as 32-bit integers, so we create a new Uint32Array from the original one.
        if (complement.has("uDark_cssClass") && !(editionConfidence >= 100)) {
            let linesColorCheck = uDark.check_image_lines_content(canvas, ctx)
            if ((linesColorCheck.linesAchromaticOpaqueCount > 2 || linesColorCheck.linesGradientsCount > 2) && linesColorCheck.linesFullAlphaCount == 0) {
                editionConfidence += 100;
            }
            editionStatus.linesColorCheck = linesColorCheck;
        }
        const imageData = editionStatus.imageData;

        const theImageDataClamped8TMP = editionStatus.theImageDataClamped8TMP;
        for (let i = 0; i < theImageDataClamped8TMP.length; i += 4) {
            let r = imageData.data[i];
            let g = imageData.data[i + 1];
            let b = imageData.data[i + 2];
            const L = uDark.getPerceivedLightness_approx(r, g, b);
            let factor = Math.pow(255 / (L + 127), L / 127 * 2.8);
            if (L > 127) {
                theImageDataClamped8TMP[i] = r * factor;
                theImageDataClamped8TMP[i + 1] = g * factor;
                theImageDataClamped8TMP[i + 2] = b * factor;
            }
            else if (editionStatus.isContrastBright) {
                const colorStrength = uDark.colorStrength(r, g, b);
                if (colorStrength < 0.1) {

                    theImageDataClamped8TMP[i] = 255 - r
                    theImageDataClamped8TMP[i + 1] = 255 - g
                    theImageDataClamped8TMP[i + 2] = 255 - b

                }
            }

        }


        console.log("Background", details.url, details.requestId, "Background edited in", performance.now() - perf_start);
        imageData.data.set(theImageDataClamped8TMP);

        ctx.putImageData(imageData, 0, 0);

        console.log("Background", details.url, details.requestId, "Put back in context", performance.now() - perf_start);
        editionStatus.edited = true;
        editionStatus.heuristic = "edited_background"
        return true;
    },
    binarizeKeepHue(r, g, b) {
        // Normaliser en [0,1]
        r /= 255; g /= 255; b /= 255;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const chroma = max - min;

        let h = 0;
        if (chroma > 0) {
            if (max === r) {
                h = ((g - b) / chroma) % 6;
            } else if (max === g) {
                h = (b - r) / chroma + 2;
            } else {
                h = (r - g) / chroma + 4;
            }
            h *= 60;
            if (h < 0) h += 360;
        }

        // Calcul de la luminance perçue (0–255)
        const L = 0.2126 * r * 255 + 0.7152 * g * 255 + 0.0722 * b * 255;

        // Seuil comme ton test
        const targetLight = (L > 127) ? 0.25 : 0.75; // clair ou foncé mais pas blanc/noir

        // On force saturation = 1
        return uDark.hslToRgb(h, 1, targetLight);
    },

    // Conversion HSL -> RGB
    hslToRgb(h, s, l) {
        h /= 360;
        let r, g, b;

        if (s === 0) {
            r = g = b = l; // gris
        } else {
            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1 / 6) return p + (q - p) * 6 * t;
                if (t < 1 / 2) return q;
                if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
                return p;
            };

            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r = hue2rgb(p, q, h + 1 / 3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1 / 3);
        }

        return [
            Math.round(r * 255),
            Math.round(g * 255),
            Math.round(b * 255)
        ];
    },

    colorStrength(r, g, b) {
        // Normalisation en 0–1
        r /= 255; g /= 255; b /= 255;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);

        if (max === 0) return 0; // noir → pas de couleur

        const chroma = max - min;
        const saturation = chroma / max; // saturation HSV
        const value = max;               // luminosité HSV

        return saturation * value; // quantité de couleur visible
    },
    colorAmount(r, g, b) {
        // Normaliser entre 0 et 1
        r /= 255;
        g /= 255;
        b /= 255;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);

        if (max === 0) {
            return 0; // noir → pas de couleur
        }

        const chroma = max - min;
        return chroma / max; // saturation HSV = quantité de couleur
    },
    rgb2hue(r, g, b) {
        r /= 255;
        g /= 255;
        b /= 255;
        var max = Math.max(r, g, b);
        var min = Math.min(r, g, b);
        var c = max - min;
        var hue;
        if (c == 0) {
            hue = 0;
        } else {
            switch (max) {
                case r:
                    var segment = (g - b) / c;
                    var shift = 0 / 60;       // R° / (360° / hex sides)
                    if (segment < 0) {          // hue > 180, full rotation
                        shift = 360 / 60;         // R° / (360° / hex sides)
                    }
                    hue = segment + shift;
                    break;
                case g:
                    var segment = (b - r) / c;
                    var shift = 120 / 60;     // G° / (360° / hex sides)
                    hue = segment + shift;
                    break;
                case b:
                    var segment = (r - g) / c;
                    var shift = 240 / 60;     // B° / (360° / hex sides)
                    hue = segment + shift;
                    break;
            }
        }
        return hue * 60; // hue is in [0,6], scale it up
    },
    hslToRgb(h, s, l) {
        let r, g, b;

        if (s === 0) {
            r = g = b = l; // achromatic
        } else {
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r = uDark.hueToRgb(p, q, h + 1 / 3);
            g = uDark.hueToRgb(p, q, h);
            b = uDark.hueToRgb(p, q, h - 1 / 3);
        }

        return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
    },

    hueToRgb(p, q, t) {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
    },
    rgbToSaturation(r, g, b) {
        // Normaliser entre 0 et 1
        let rn = r / 255;
        let gn = g / 255;
        let bn = b / 255;

        // Trouver min et max
        let cmax = Math.max(rn, gn, bn);
        let cmin = Math.min(rn, gn, bn);
        let delta = cmax - cmin;

        // Calcul de la saturation
        let s = (cmax === 0) ? 0 : delta / cmax;

        return s; // valeur entre 0 et 1
    },

    // Exemple :

    async resizeImageBitmap(imgBitmap, scale = 0.5) {
        const newW = Math.max(1, Math.floor(imgBitmap.width * scale));
        const newH = Math.max(1, Math.floor(imgBitmap.height * scale));

        const off = new OffscreenCanvas(newW, newH);
        const ctx = off.getContext('2d');

        // Draw at new size
        ctx.drawImage(imgBitmap, 0, 0, newW, newH);

        // Create a new ImageBitmap from the scaled canvas
        return await createImageBitmap(off);
    },
    edit_an_image: async function (details) {
        details.requestId = details.url.split('').map(v => v.charCodeAt(0)).reduce((a, v) => a + ((a << 7) + (a << 3)) ^ v).toString(16);
        let editionStatus = {
            edited: false,
            statsComplete: false,
            editionConfidenceLogo: 0,
            editionConfidenceBackground: 0,
        };

        // Determine some basic required things about the image

        let imageURLObject = new URL(details.url);

        // Determine the transformation function to use
        let complementIndex = imageURLObject.hash.indexOf("_uDark")
        let complement = new URLSearchParams(complementIndex == -1 ? "" : imageURLObject.hash.slice(complementIndex + 6))
        let edition_order_hooks = [uDark.background_image_edit_hook,
        uDark.logo_image_edit_hook
        ];

        if (uDark.ignore_match.test(imageURLObject.search + complement.get("class") + complement.get("uDark_cssClass"))) {
            return {}
        }
        let hasBGRepeat = complement.has("uDark_backgroundRepeat") && /(?<!no-)repeat|round|space/i.test(complement.get("uDark_backgroundRepeat"));
        let cssGuess = complement.get("css-guess");
        let hasDirectCSSFont = complement.has("uDark_directCssFont");
        
        let imageStrToCheck = imageURLObject.pathname
                    + imageURLObject.search
                    + complement.get("class")
                    + complement.get("uDark_cssClass")

        if (hasDirectCSSFont || hasBGRepeat ||
            uDark.background_match.test(imageStrToCheck)) {
            editionStatus.editionConfidenceBackground = 100;
            edition_order_hooks = [uDark.background_image_edit_hook];
        }


        if ((!hasBGRepeat || cssGuess == "logo-toggle") &&
            (
                complement.has("inside_clickable")
                || complement.has("logo_match")
                || uDark.logo_match.test(
                    imageStrToCheck
                )
            ) && !uDark.non_logo_match.test(imageStrToCheck) ){

            edition_order_hooks = [uDark.logo_image_edit_hook];
        }

        if (!edition_order_hooks.length) {
            return {}
        }

        console.log("Image", "Editing image", details.fromCache, details.url, details.requestId, details.isDataUrl);
        // Do the common tasks required for all edited images
        let perf_start = performance.now();

        console.log("Image", "Filter has stopped", performance.now() - perf_start, details.url, details.requestId);
        // NOTE: TODO: Improve: If the image has a 404 state the server returns html, and canvas can't draw it and loose at least 3 seconds understanding it
        if (details.statusCode && details.statusCode >= 400) {
            return editionStatus;
        }
        console.log("Image", "Status code ok", performance.now() - perf_start, details.url, details.requestId);


        // let blob = {
        //   arrayBuffer: x => ({
        //     then: x => details.dataUrl
        //   })
        // }

        let blob = (new Blob(imageBuffers));
        console.log("Image", "Blob created", performance.now() - perf_start, details.url, details.requestId)
        let imageBitmap;
        try {

            imageBitmap = await createImageBitmap(blob);



        }
        catch (e) {
            console.log("Image", "Invalid or disposed image", performance.now() - perf_start, details.url, details.requestId, details, blob)
            // Invalid or disposed image.
            return editionStatus;

        }




        if (editionStatus.is_photo) { editionStatus.editionConfidenceBackground = -1000 }
        // blob.arrayBuffer().then((buffer) => {
        {

            console.log("Image", "created ImageBitmap", performance.now() - perf_start, details.url, details.requestId)
            // Create an Image object


            // const reader = new FileReader() // Faster but ad what cost later ? 
            // // 2. Add a handler for the 'onload' event
            // reader.onload = (e) => {
            //     // 5. Get the result when the 'onload' event is triggered.
            //     const base64data = reader.result               
            //     console.log("Image to base 64",performance.now() - perf_start,details.url,details.requestId,{base64data});
            //     img.src = base64data;
            // }
            // // 3. Add a handler for the 'onerror' event
            // reader.onerror = () => {                
            //     console.log('error')
            // }
            // // // 4. Call 'readAsDataURL' method

            // reader.readAsDataURL(blob)

            const canvas = new OffscreenCanvas(imageBitmap.width, imageBitmap.height);
            const ctx = canvas.getContext('2d',/* {willReadFrequently:true} is a exiting option, but needs benchmarking */);
            for (let imageEditionHook of edition_order_hooks) {
                if (editionStatus.edited === false) {

                    console.log("Image edition hook", imageEditionHook.name, performance.now() - perf_start, details.url, details.requestId)
                    await imageEditionHook(editionStatus, canvas, ctx, imageBitmap, blob, details, imageURLObject, complement);
                    console.log("Image acceptance", editionStatus.edited, editionStatus.rejected, performance.now() - perf_start, details.url, details.requestId)
                }
            }
            if (editionStatus.edited === true) {


                // Write the edited image to the filter and disconnect it
                console.log("Image", "Going blob", performance.now() - perf_start, details.url, details.requestId);
                let editedBlobWithImageHeaders = await canvas.convertToBlob();
                let buffer = await editedBlobWithImageHeaders.arrayBuffer();

                console.log("Image", "Canvas to blob done", performance.now() - perf_start, details.url, details.requestId);
                console.log("Image", "Blob to arraybuffer", performance.now() - perf_start, details.url, details.requestId);

                editionStatus.editedBuffer = buffer;
                console.log("Image", "Image written in filter having edited it", performance.now() - perf_start, details.url, details.requestId);
            }

            return editionStatus;

        };

    }

}


console.timeEnd('load:imageWorkerHeuristic.js');
// --- END imageWorkerHeuristic.js ---

// --- BEGIN messageLogicPooled.js ---
console.time('load:messageLogicPooled.js');
// Logique de messaging pooled (TransformStream)
// Ce fichier doit être chargé AVANT la logique métier (ex: imageWorkerHeuristicPooled.js)

let imageBuffers = [];
let activeMessageLogging = false;
if(!activeMessageLogging)
    {
    console.log =()=>undefined
}

self.onmessage = async (ev) => {
    const { inReadable, outWritable } = ev.data;
    
    // Transform: XOR sur chaque chunk (Uint8Array)
    const transform = new TransformStream({
        async transform(chunk, controller) {
            // Découpage du header 8 octets (UInt64 little endian)
            const dv = new DataView(chunk.buffer, chunk.byteOffset, chunk.byteLength);
            const metaLen = Number(dv.getBigUint64(0, true));
            let meta = null, details = null, payload = null;
            if (metaLen > 0) {
                const metaBytes = new Uint8Array(chunk.buffer, chunk.byteOffset + 8, metaLen);
                meta = new TextDecoder().decode(metaBytes);
                try { details = JSON.parse(meta);
                     console.log("Parsed metadata JSON", details);
                 } catch (e) {
                     details = null;console.error("Failed to parse metadata JSON", e);
                     }
            }
            payload = new Uint8Array(chunk.buffer, chunk.byteOffset + 8 + metaLen, chunk.byteLength - 8 - metaLen);
            // ... ici tu fais ce que tu veux avec details et payload ...
            // Par défaut, on renvoie juste le payload inchangé

            imageBuffers = [payload];
          
            const editionResult = await self.uDark.edit_an_image(details);

            if (editionResult.edited) {
                payload = new Uint8Array(editionResult.editedBuffer);
            }
            // On renvoie le payload (éventuellement modifié)
            controller.enqueue(payload);
        }
    });
    
    // Chaînage: backpressure gérée nativement
    const piping = inReadable.pipeThrough(transform).pipeTo(outWritable);
    if(ev.data.workerData && ev.data.workerData.iaModelJsonBuffer && ev.data.workerData.iaModelWeightsBuffer) {
            WorkerGlobalScope.modelBuffer = ev.data.workerData.iaModelJsonBuffer;
            WorkerGlobalScope.weightsBuffer = ev.data.workerData.iaModelWeightsBuffer;
            console.log("Worker has model buffers",ev);
    }
    else
    {
        console.log("Worker has no model buffers",ev.workerData);
    }
    // Handshake "ready" pour mesurer l'init côté main
    self.postMessage({ ready: true });
    
    try { await piping; } catch (_) { /* fermeture normale */ }
};

console.timeEnd('load:messageLogicPooled.js');
// --- END messageLogicPooled.js ---

