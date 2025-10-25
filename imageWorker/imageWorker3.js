// imageWorker3.js - Improved structure for image processing worker

// Utility functions for color and lightness
const ColorUtils = {
  RGBToLinearLightness(r, g, b) {
    return (Math.max(r, g, b) + Math.min(r, g, b)) / 2;
  },
  getPerceivedLightness_approx(r, g, b) {
    return 0.299 * r + 0.587 * g + 0.114 * b;
  },
  isGrayscale(bitmap, tolerance = 4) {
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(bitmap, 0, 0);
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i + 1], b = data[i + 2];
      if (Math.max(r, g, b) - Math.min(r, g, b) > tolerance) return false;
    }
    return true;
  }
};

// Heuristic rules for image classification
const Heuristics = {
  colorDiversityCheck(editionStatus, minColors = 32) {
    // Returns true if color diversity is above threshold
    if (!editionStatus.opaqueColorCounter || typeof editionStatus.opaqueColorCounter.size !== 'number') return false;
    return editionStatus.opaqueColorCounter.size >= minColors;
  },
  background_match: /background|sprite|(?<![a-z])(bg|box|panel|fond|fundo|bck)(?![a-z])/i,
  logo_match: /nav|avatar|logo|icon|alert|notif|cart|menu|tooltip|dropdown|control/i,
  isPhoto(bitmap, editionStatus) {
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(bitmap, 0, 0);
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let pixelCount = data.length / 4;
    let opaqueColors = new Set();
    let lightnessVals = new Set();
    let colorThresh = editionStatus.isGrayscale ? 393 * 2 : 393;
    let lightnessThresh = editionStatus.isGrayscale ? 9835 * 2 : 9835;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
      let val = ((a << 24) | (b << 16) | (g << 8) | r);
      lightnessVals.add(val);
      if (a === 255) opaqueColors.add(val);
      if (
        pixelCount / opaqueColors.size <= colorThresh &&
        pixelCount / lightnessVals.size <= lightnessThresh
      ) return true;
    }
    return false;
  },
  async isPhotoStat(editionStatus, sourceBitmap, details) {
    // Grid sampling for large images
    let grid = 50, count = 5, gridW = grid * count;
    let resizeW = Math.min(sourceBitmap.width, gridW), resizeH = Math.min(sourceBitmap.height, gridW);
    const targetBitmap = await createImageBitmap(sourceBitmap, 0, 0, sourceBitmap.width, sourceBitmap.height, { resizeWidth: resizeW, resizeHeight: resizeH });
    editionStatus.isGrayscale = ColorUtils.isGrayscale(targetBitmap);
    if (resizeH === gridW && resizeW === gridW) {
      for (let row = 0; row < count; row++) {
        for (let col = 0; col < count; col++) {
          let testBitmap = await createImageBitmap(targetBitmap, col * grid, row * grid, grid, grid);
          if (Heuristics.isPhoto(testBitmap, editionStatus)) return true;
        }
      }
    } else {
      return Heuristics.isPhoto(targetBitmap, editionStatus);
    }
    return false;
  },
  checkImageLinesContent(canvas, ctx) {
    // Border and center line analysis
    const getLine = (x, y, w, h) => ctx.getImageData(x, y, w, h).data;
    const lines = [
      getLine(0, 0, 1, canvas.height),
      getLine(canvas.width - 1, 0, 1, canvas.height),
      getLine(0, 0, canvas.width, 1),
      getLine(0, canvas.height - 1, canvas.width, 1),
      getLine(canvas.width / 2, 0, 1, canvas.height),
      getLine(0, canvas.height / 2, canvas.width, 1)
    ];
    let achromaticCount = 0, achromaticOpaqueCount = 0, gradientsCount = 0;
    let achromatic = Array(10).fill(false), gradients = Array(10).fill(false);
    lines.forEach((data, i) => {
      let first = ((data[3] << 24) | (data[2] << 16) | (data[1] << 8) | data[0]);
      let isAchromatic = true, isGradient = true;
      for (let n = 0; n < data.length; n += 4) {
        let val = ((data[n + 3] << 24) | (data[n + 2] << 16) | (data[n + 1] << 8) | data[n]);
        if (val !== first) isAchromatic = false;
        let r = data[n], g = data[n + 1], b = data[n + 2], a = data[n + 3];
        let lightness = Math.max(ColorUtils.getPerceivedLightness_approx(r, g, b), a);
        if (n > 0) {
          let prevLightness = Math.max(ColorUtils.getPerceivedLightness_approx(data[n - 4], data[n - 3], data[n - 2]), data[n - 1]);
          if (Math.abs(lightness - prevLightness) > 5) isGradient = false;
        }
      }
      if (isAchromatic) {
        achromatic[i] = true;
        achromaticCount++;
        if ((first >> 24) === 255) achromaticOpaqueCount++;
      }
      if (isGradient) {
        gradients[i] = true;
        gradientsCount++;
      }
    });
    return {
      achromaticCount,
      gradients,
      achromaticOpaqueCount,
      achromatic,
      gradientsCount,
      linesWithSomeAlpha: achromaticCount - achromaticOpaqueCount,
      linesFullAlphaCount: achromatic.filter((x, idx) => x && lines[idx][3] === 0).length
    };
  }
};

// Main image worker logic
class ImageWorker {
  constructor() {
    this.imageBuffers = [];
    this.experimentalAttemptImageStat = true;
    this.disableBackgroundPostCheck = false;
  }

  async editImage(details) {
    details.requestId = details.url.split('').map(v => v.charCodeAt(0)).reduce((a, v) => a + ((a << 7) + (a << 3)) ^ v, 0).toString(16);
    let editionStatus = {
      edited: false,
      statsComplete: false,
      editionConfidenceLogo: 0,
      editionConfidenceBackground: 0
    };
    let imageURLObject = new URL(details.url);
    let complementIndex = imageURLObject.hash.indexOf('_uDark');
    let complement = new URLSearchParams(complementIndex === -1 ? '' : imageURLObject.hash.slice(complementIndex + 6));
    let editionOrderHooks = [this.backgroundImageEditHook.bind(this), this.logoImageEditHook.bind(this)];
    if (Heuristics.background_match.test(imageURLObject.search + complement.get('class') + complement.get('uDark_cssClass'))) {
      editionStatus.editionConfidenceBackground = 100;
      editionOrderHooks = [this.backgroundImageEditHook.bind(this)];
    }
    if (complement.has('inside_clickable') || Heuristics.logo_match.test(imageURLObject.search + complement.get('class') + complement.get('uDark_cssClass'))) {
      editionOrderHooks = [this.logoImageEditHook.bind(this)];
    }
    if (!editionOrderHooks.length) return {};
    let blob = new Blob(this.imageBuffers);
    let imageBitmap;
    try {
      imageBitmap = await createImageBitmap(blob);
    } catch (e) {
      return editionStatus;
    }
    if (this.experimentalAttemptImageStat) {
      editionStatus.is_photo = await Heuristics.isPhotoStat(editionStatus, imageBitmap, details);
    }
    if (editionStatus.is_photo) editionStatus.editionConfidenceBackground = -1000;
    const canvas = new OffscreenCanvas(imageBitmap.width, imageBitmap.height);
    const ctx = canvas.getContext('2d');
    for (let hook of editionOrderHooks) {
      if (!editionStatus.edited) hook(editionStatus, canvas, ctx, imageBitmap, blob, details, imageURLObject, complement);
    }
    if (editionStatus.edited) {
      let editedBlob = await canvas.convertToBlob();
      editionStatus.editedBuffer = await editedBlob.arrayBuffer();
      this.imageBuffers = [editionStatus.editedBuffer];
    }
    return editionStatus;
  }

  async resizeImageBitmap(imgBitmap, scale = 0.5) {
    const newW = Math.max(1, Math.floor(imgBitmap.width * scale));
    const newH = Math.max(1, Math.floor(imgBitmap.height * scale));
    const off = new OffscreenCanvas(newW, newH);
    const ctx = off.getContext('2d');
    ctx.drawImage(imgBitmap, 0, 0, newW, newH);
    return await createImageBitmap(off);
  }

  logoImageEditHook(editionStatus, canvas, ctx, img, blob, details, imageURLObject, complement) {
    ctx.drawImage(img, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let buffer = new ArrayBuffer(imageData.data.length);
    let clamped = new Uint8ClampedArray(buffer);
    clamped.set(imageData.data);
    let uint32 = new Uint32Array(buffer);
    let n = uint32.length;
    if (!editionStatus.statsComplete) {
      Object.assign(editionStatus, {
        colorCounter: new Set(),
        opaqueColorCounter: new Set(),
        lightnessCounter: new Set(),
        alphaCounter: new Set(),
        lightness_sum: 0,
        alpha_sum: 0,
        alpha_qty: 0
      });
    }
    while (n--) {
      var number = uint32[n];
      var r = number & 0xff, g = (number >> 8) & 0xff, b = (number >> 16) & 0xff, a = (number >> 24) & 0xff;
      let lightness = ColorUtils.getPerceivedLightness_approx(r, g, b);
      if (!editionStatus.statsComplete) {
        editionStatus.colorCounter.add(number);
        editionStatus.lightness_sum += lightness;
        editionStatus.lightnessCounter.add(lightness);
        editionStatus.alphaCounter.add(a);
        editionStatus.alpha_sum += a;
        if (a === 255) editionStatus.opaqueColorCounter.add(number);
        editionStatus.is_photo = uint32.length / editionStatus.opaqueColorCounter.size <= 393 && uint32.length / editionStatus.lightnessCounter.size <= 9835;
      }
      let lightenUnder = 127, edit_under_lightness = 100;
      if (lightness < lightenUnder && lightness < edit_under_lightness) {
        [r, g, b] = [r, g, b].map(x => x + Math.pow(lightenUnder - lightness, 1.11));
      }
      uint32[n] = ((a << 24) | (b << 16) | (g << 8) | r);
    }
    if (!editionStatus.statsComplete) {
      editionStatus.avg_ligtness = editionStatus.lightness_sum / uint32.length;
      editionStatus.alpha_percent = editionStatus.alpha_qty / uint32.length;
      editionStatus.contrast = Math.max(...editionStatus.lightnessCounter) - Math.min(...editionStatus.lightnessCounter);
      editionStatus.contrast_percent = editionStatus.contrast / 255;
      editionStatus.max_lightness = Math.max(...editionStatus.lightnessCounter);
      editionStatus.min_lightness = Math.min(...editionStatus.lightnessCounter);
      editionStatus.statsComplete = true;
    }
    if (editionStatus.statsComplete && !editionStatus.is_photo) {
      if (editionStatus.colorCounter.size > 1 && editionStatus.alpha_percent < 0.1 && editionStatus.min_lightness < 255 * 0.4 && editionStatus.contrast_percent > 0.7) {
        clamped.set(imageData.data);
        let n = uint32.length;
        while (n--) {
          var number = uint32[n];
          var r = number & 0xff, g = (number >> 8) & 0xff, b = (number >> 16) & 0xff, a = (number >> 24) & 0xff;
          let lightness = (Math.max(r, g, b, 255 - a) + Math.min(r, g, b, 255 - a)) / 2;
          uint32[n] = lightness < 25 ? 0xffffffff : 0x00000000;
        }
        imageData.data.set(clamped);
        ctx.putImageData(imageData, 0, 0);
        ctx.filter = 'blur(3px)';
        let resource = canvas;
        for (let i = 0; i < 5; i++) ctx.drawImage(resource, 0, 0);
        ctx.filter = 'none';
        ctx.drawImage(img, 0, 0);
        editionStatus.edited = true;
        return true;
      }
    }
    imageData.data.set(clamped);
    ctx.putImageData(imageData, 0, 0);
    editionStatus.edited = true;
    return true;
  }

  backgroundImageEditHook(editionStatus, canvas, ctx, img, blob, details, imageURLObject, complement) {
    let editionConfidence = editionStatus.editionConfidenceBackground;
    ctx.drawImage(img, 0, 0);
    if (complement.has('uDark_cssClass') && editionConfidence < 100) {
      let linesColorCheck = Heuristics.checkImageLinesContent(canvas, ctx);
      if ((linesColorCheck.achromaticOpaqueCount > 2 || linesColorCheck.gradientsCount > 2) && linesColorCheck.linesFullAlphaCount === 0) {
        editionConfidence += 100;
      }
      editionStatus.linesColorCheck = linesColorCheck;
    }
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let buffer = new ArrayBuffer(imageData.data.length);
    let clamped = new Uint8ClampedArray(buffer);
    clamped.set(imageData.data);
    let uint32 = new Uint32Array(buffer);
    let n = uint32.length;
    if (!editionStatus.statsComplete) {
      Object.assign(editionStatus, {
        colorCounter: new Set(),
        opaqueColorCounter: new Set(),
        lightnessCounter: new Set(),
        alphaCounter: new Set(),
        lightness_sum: 0,
        alpha_sum: 0,
        alpha_qty: 0
      });
    }
    while (n--) {
      var number = uint32[n];
      var r = number & 0xff, g = (number >> 8) & 0xff, b = (number >> 16) & 0xff, a = (number >> 24) & 0xff;
      let lightness = ColorUtils.getPerceivedLightness_approx(r, g, b);
      editionStatus.colorCounter.add(number);
      editionStatus.lightness_sum += lightness;
      editionStatus.lightnessCounter.add(lightness);
      editionStatus.alphaCounter.add(a);
      editionStatus.alpha_sum += a;
      if (a === 255) editionStatus.opaqueColorCounter.add(number);
      if (lightness > 127) {
        [r, g, b] = [r, g, b].map(x => x * Math.pow(255 / (lightness + 127), lightness / 127 * 2.8));
        uint32[n] = ((a << 24) | (b << 16) | (g << 8) | r);
      }
      let opaqueColorCounterRatio = uint32.length / editionStatus.opaqueColorCounter.size;
      let lightnessCounterRatio = uint32.length / editionStatus.lightnessCounter.size;
      editionStatus.is_photo = opaqueColorCounterRatio <= 393 && lightnessCounterRatio <= 9835 && lightnessCounterRatio > 9835 * 0.07;
      if (editionStatus.is_photo) editionConfidence--;
    }
    if (!editionStatus.statsComplete) {
      editionStatus.avg_ligtness = editionStatus.lightness_sum / uint32.length;
      editionStatus.alpha_percent = editionStatus.alpha_qty / uint32.length;
      editionStatus.contrast = Math.max(...editionStatus.lightnessCounter) - Math.min(...editionStatus.lightnessCounter);
      editionStatus.contrast_percent = editionStatus.contrast / 255;
      editionStatus.max_lightness = Math.max(...editionStatus.lightnessCounter);
      editionStatus.min_lightness = Math.min(...editionStatus.lightnessCounter);
      editionStatus.statsComplete = true;
    }
    if (editionStatus.statsComplete && !this.disableBackgroundPostCheck) {
      if (editionStatus.contrast_percent > 0.77 && editionStatus.avg_ligtness > 220 && editionStatus.max_lightness >= 204) {
        ctx.filter = 'invert(0.9) hue-rotate(180deg)';
        ctx.drawImage(img, 0, 0);
        editionStatus.edited = true;
        return true;
      } else if (editionStatus.colorCounter.size > 1) {
        if (editionStatus.alpha_percent > 0.1 && !(editionStatus.alpha_qty * 2 > uint32.length)) return false;
        let min_bright_trigger = 255 * 0.4;
        if (editionStatus.avg_ligtness < min_bright_trigger && editionStatus.max_lightness < min_bright_trigger) {
          editionStatus.probable_dark_background_having_contrast = true;
          return false;
        }
        if (editionStatus.contrast_percent > 0.45 && editionStatus.avg_ligtness > 127 || editionStatus.contrast_percent > 0.6) {
          return false;
        }
      }
    }
    imageData.data.set(clamped);
    ctx.putImageData(imageData, 0, 0);
    editionStatus.edited = true;
    return true;
  }
}

// Worker message handler
const worker = new ImageWorker();
onmessage = async (e) => {
  if (e.data.oneImageBuffer) {
    worker.imageBuffers.push(e.data.oneImageBuffer);
  }
  if (e.data.filterStopped) {
    let editionResult = await worker.editImage(e.data.details);
    if (editionResult.editedBuffer) {
      worker.imageBuffers = [editionResult.editedBuffer];
    }
    postMessage({ editionComplete: 1, buffers: worker.imageBuffers }, worker.imageBuffers);
    worker.imageBuffers = [];
  }
};
