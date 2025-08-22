
Set.prototype.unionFast = function(setB) {
    for (let elem of setB) {
        this.add(elem);
    }
    return this;
}
class ImageNormalizer {
    constructor(imageBitmap) {
        this.imageBitmap = imageBitmap;
        this.offscreenCanvas = new OffscreenCanvas(imageBitmap.width, imageBitmap.height);
        const ctx = canvas.getContext('2d',/* {willReadFrequently:true} is a exiting option, but needs benchmarking */); 
        this.ctx.drawImage(imageBitmap, 0, 0);
        this.imageData = this.ctx.getImageData(0, 0, imageBitmap.width, imageBitmap.height);
    }
    
    // Main method to detect if the image or any subpart is a photo
    detectPhoto({
        gridColumns = 6,
        gridRows = 5,
        earlyExitThreshold = 0.9,
        lineCheckOptions = { checkCenterLines: true, checkBorderLines: true }
    } = {}) {
        const subpartWidth = Math.floor(this.imageData.width / gridColumns);
        const subpartHeight = Math.floor(this.imageData.height / gridRows);
        const argsToSliceGrid = [];
        
        for (let row = 0; row < gridRows; row++) {
            for (let col = 0; col < gridColumns; col++) {
                const startX = col * subpartWidth;
                const startY = row * subpartHeight;
                const endX = startX + subpartWidth;
                const endY = startY + subpartHeight;
                const sliceID = row * gridColumns + col;
                const xID = col;
                const yID = row;
                
                const subpartResult = this.analyseSubpart({
                    earlyExitThreshold,
                    lineCheckOptions,
                    startX,
                    startY,
                    endX,
                    endY
                });
                
                const sliceInfo = {
                    startX,
                    startY,
                    endX,
                    endY,
                    sliceID,
                    xID,
                    yID
                };
                argsToSliceGrid.push(sliceInfo);
                
                if (subpartResult.is_photo) {
                    return {
                        is_photo: true,
                        photoDetectedAt: sliceInfo,
                        argsToSliceGrid,
                        statistics: subpartResult.statistics
                    };
                }
            }
        }
        
        // If no subpart is identified as a photo, return detailed statistics
        const analysisResult = this.analyse({
            earlyExitThreshold,
            lineCheckOptions
        });
        
        return {
            is_photo: analysisResult.is_photo,
            photoDetectedAt: null,
            argsToSliceGrid,
            statistics: analysisResult.statistics
        };
    }
    
    // Method to analyse a specific subpart of the image
    analyseSubpart({
        earlyExitThreshold = 0.9,
        lineCheckOptions = { checkCenterLines: true, checkBorderLines: true },
        startX,
        startY,
        endX,
        endY
    } = {}) {
        const subpartData = this.ctx.getImageData(startX, startY, endX - startX, endY - startY);
        const { width, height, data } = subpartData;
        
        let alphaCounter = 0;
        let pureAlphaCounter = 0;
        let lightnessSum = 0;
        let minLightness = 255;
        let maxLightness = 0;
        let uniqueColors = new Set();
        let gradientMagnitudeSum = 0;
        let totalPixels = width * height;
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const index = (y * width + x) * 4;
                const r = data[index];
                const g = data[index + 1];
                const b = data[index + 2];
                const a = data[index + 3];
                
                const lightness = (0.2126 * r + 0.7152 * g + 0.0722 * b);
                const color = `${r},${g},${b},${a}`;
                
                if (a < 255) alphaCounter++;
                if (a === 0) pureAlphaCounter++;
                lightnessSum += lightness;
                minLightness = Math.min(minLightness, lightness);
                maxLightness = Math.max(maxLightness, lightness);
                uniqueColors.add(color);
                
                // Calculate gradient magnitude
                const gradient = this.calculateGradient(data, x, y, width, height);
                gradientMagnitudeSum += gradient;
            }
        }
        
        const alphaRatio = alphaCounter / totalPixels;
        const transparencyRatio = pureAlphaCounter / totalPixels;
        const averageLightness = lightnessSum / totalPixels;
        const contrast = (maxLightness - minLightness) / 255;
        const averageGradient = gradientMagnitudeSum / totalPixels;
        
        const isPhoto = this.isPhoto({
            contrast,
            averageGradient,
            alphaRatio,
            uniqueColors: uniqueColors.size,
            totalPixels
        });
        
        return {
            is_photo: isPhoto,
            statistics: {
                alphaRatio,
                averageLightness,
                contrast,
                transparencyRatio,
                minLightness,
                maxLightness,
                uniqueColors: uniqueColors.size,
                averageGradient,
                totalLightnessSum: lightnessSum,
                totalLightnessCounter: totalPixels
            }
        };
    }
    
    // Comprehensive analysis method for the entire image
    analyse({
        earlyExitThreshold = 0.9,
        lineCheckOptions = { checkCenterLines: true, checkBorderLines: true }
    } = {}) {
        const { width, height, data } = this.imageData;
        
        let alphaCounter = 0;
        let pureAlphaCounter = 0;
        let lightnessSum = 0;
        let minLightness = 255;
        let maxLightness = 0;
        let uniqueColors = new Set();
        let gradientMagnitudeSum = 0;
        let totalPixels = width * height;
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const index = (y * width + x) * 4;
                const r = data[index];
                const g = data[index + 1];
                const b = data[index + 2];
                const a = data[index + 3];
                
                const lightness = (0.2126 * r + 0.7152 * g + 0.0722 * b);
                const color = `${r},${g},${b},${a}`;
                
                if (a < 255) alphaCounter++;
                if (a === 0) pureAlphaCounter++;
                lightnessSum += lightness;
                minLightness = Math.min(minLightness, lightness);
                maxLightness = Math.max(maxLightness, lightness);
                uniqueColors.add(color);
                
                // Calculate gradient magnitude
                const gradient = this.calculateGradient(data, x, y, width, height);
                gradientMagnitudeSum += gradient;
            }
        }
        
        const alphaRatio = alphaCounter / totalPixels;
        const transparencyRatio = pureAlphaCounter / totalPixels;
        const averageLightness = lightnessSum / totalPixels;
        const contrast = (maxLightness - minLightness) / 255;
        const averageGradient = gradientMagnitudeSum / totalPixels;
        
        const isPhoto = this.isPhoto({
            contrast,
            averageGradient,
            alphaRatio,
            uniqueColors: uniqueColors.size,
            totalPixels
        });
        
        return {
            is_photo: isPhoto,
            statistics: {
                alphaRatio,
                averageLightness,
                contrast,
                transparencyRatio,
                minLightness,
                maxLightness,
                uniqueColors: uniqueColors.size,
                averageGradient,
                totalLightnessSum: lightnessSum,
                totalLightnessCounter: totalPixels
            }
        };
    }
    
    // Calculate gradient magnitude at a given pixel using the Sobel operator
    calculateGradient(data, x, y, width, height) {
        const index = (y * width + x) * 4;
        const gx = this.getPixelValue(data, x + 1, y, width, height) - this.getPixelValue(data, x - 1, y, width, height);
        const gy = this.getPixelValue(data, x, y + 1, width, height) - this.getPixelValue(data, x, y - 1, width, height);
        
        return Math.sqrt(gx * gx + gy * gy);
    }
    
    // Helper to safely get pixel value and handle boundaries
    getPixelValue(data, x, y, width, height) {
        if (x < 0 || x >= width || y < 0 || y >= height) return 0;
        const index = (y * width + x) * 4;
        return 0.2126 * data[index] + 0.7152 * data[index + 1] + 0.0722 * data[index + 2]; // lightness
    }
    
    // Advanced photo detection using statistical analysis
    isPhoto({ contrast, averageGradient, alphaRatio, uniqueColors, totalPixels }) {
        // Thresholds for photo detection (adjust based on experimentation)
        const contrastThreshold = 0.3;
        const gradientThreshold = 15;
        const alphaThreshold = 0.1;
        const uniqueColorRatioThreshold = 0.1;
        
        const uniqueColorRatio = uniqueColors / totalPixels;
        
        return (
            contrast > contrastThreshold &&
            averageGradient > gradientThreshold &&
            alphaRatio < alphaThreshold &&
            uniqueColorRatio > uniqueColorRatioThreshold
        );
    }
}



class ImageNormalizerOld {
    constructor(imageBitmap) {
        this.offscreenCanvas = new OffscreenCanvas(imageBitmap.width, imageBitmap.height);
        this.imageBitmap = imageBitmap;
        const ctx = canvas.getContext('2d',/* {willReadFrequently:true} is a exiting option, but needs benchmarking */); 
        this.drawImage();
        this.grayScaleComputed = this.isGrayscale();
        this.trigger_ratio_size_number_colors =  10;
        this.trigger_ratio_size_number_lightness_photo = 9835
        
    }
    RGBToLinearLightness(r, g, b) {
        return (Math.max(r, g, b) + Math.min(r, g, b)) / 2;
    }
    getPerceivedLightness_approx(r, g, b) {
        return (0.299 * r + 0.587 * g + 0.114 * b);
    }
    // lazy drawImage function
    drawImage() {
        
        this.ctx.drawImage(this.imageBitmap, 0, 0);
        // this.drawImage = ()=>{};
    }
    // lazy property for pixel data:
    get imageData() {
        if (!this._imageData) {
            this.drawImage();
            this._imageData  = this.ctx.getImageData(0, 0, this.offscreenCanvas.width, this.offscreenCanvas.height);
        }
        return this._imageData;
    }
    
    // lazy getter for the pixel count
    // async reSizeAndGetGridCutArguments(imageBitmap,resizeWidth,resizeHeight,sliceCountX,sliceCountY){ {
    //     const width = imageBitmap.width;
    //     const height = imageBitmap.height;
    
    //     const resizedBitmap = await createImageBitmap(imageBitmap, 0, 0, width, height, { resizeWidth, resizeHeight });
    
    
    //     return [argsToSliceGrid, resizedBitmap];
    // }
    
    getGridCutArguments(imageBitmap, countX, countY) {
        const width = imageBitmap.width;
        const height = imageBitmap.height;
        
        const sliceWidth = Math.floor(width / countX);
        const sliceHeight = Math.floor(height / countY);
        
        const argsToSliceGrid = [];
        let sliceID = 0;
        for (let i = 0; i < countY; i++) {
            for (let j = 0; j < countX; j++) {
                const startX = j * sliceWidth;
                const startY = i * sliceHeight;
                const endX = (j + 1) * sliceWidth;
                const endY = (i + 1) * sliceHeight;
                sliceID++;
                argsToSliceGrid.push({startX, startY, endX, endY, sliceID,xID:j,yID:i});
            }
        }
        
        return [argsToSliceGrid, sliceWidth, sliceHeight];
    }
    getGridCutArgsPX(imageBitmap, sliceWidthPX, sliceHeightPX) {
        const countX = Math.ceil(imageBitmap.width / sliceWidthPX);
        const countY = Math.ceil(imageBitmap.height / sliceHeightPX);
        return this.getGridCutArguments(imageBitmap, countX, countY);
    }
    classifyImage(imageData) {
        const data = imageData.data;
        const width = imageData.width;
        const height = imageData.height;
        const numPixels = width * height;
        
        let rHistogram = new Array(256).fill(0);
        let gHistogram = new Array(256).fill(0);
        let bHistogram = new Array(256).fill(0);
        
        let totalR = 0, totalG = 0, totalB = 0;
        let totalSquaredR = 0, totalSquaredG = 0, totalSquaredB = 0;
        
        for (let i = 0; i < data.length; i += 4) {
            let r = data[i];
            let g = data[i + 1];
            let b = data[i + 2];
            
            totalR += r;
            totalG += g;
            totalB += b;
            
            totalSquaredR += r * r;
            totalSquaredG += g * g;
            totalSquaredB += b * b;
            
            rHistogram[r]++;
            gHistogram[g]++;
            bHistogram[b]++;
        }
        
        const meanR = totalR / numPixels;
        const meanG = totalG / numPixels;
        const meanB = totalB / numPixels;
        
        const varianceR = (totalSquaredR / numPixels) - (meanR * meanR);
        const varianceG = (totalSquaredG / numPixels) - (meanG * meanG);
        const varianceB = (totalSquaredB / numPixels) - (meanB * meanB);
        
        const colorVariance = varianceR + varianceG + varianceB;
        
        function calculateEntropy(histogram) {
            let entropy = 0;
            for (let i = 0; i < 256; i++) {
                if (histogram[i] > 0) {
                    let p = histogram[i] / numPixels;
                    entropy -= p * Math.log2(p);
                }
            }
            return entropy;
        }
        
        const entropyR = calculateEntropy(rHistogram);
        const entropyG = calculateEntropy(gHistogram);
        const entropyB = calculateEntropy(bHistogram);
        
        const totalEntropy = entropyR + entropyG + entropyB;
        
        // Classify based on computed statistics
        if (colorVariance < 50) {
            return "Gradient/Neutral Background";
        } else if (totalEntropy < 18) {
            return "Logo";
        } else {
            return "Photo";
        }
    }
    analyseOneSlice(imageData,options={removeNoiseValue:0}) {
        const data = imageData.data;
        const pixelCount = data.length / 4;
        
        // needed variables for is_photo
        let uniqueOpaqueColors = new Set();
        let uniqueLightnessValues = new Set();
        let alphaCounter = 0;
        let pureAlphaCounter = 0;
        let lightnessMin = Infinity;
        let lightnessMax = -Infinity;
        let gradientLinesCount = 0;
        let fullyTransparentLinesCount = 0;
        let totalLightnessSum = 0;
        let totalLightnessCounter = 0;
        
        
        
        // Analyze the key lines for gradients and transparency
        const { gradients, transparentLines } = this.checkGradientsAndTransparency(imageData);
        gradientLinesCount += gradients;
        fullyTransparentLinesCount += transparentLines;
        
        
        for (let i = 0; i < data.length; i += 4) {
            let r = data[i];
            let g = data[i + 1];
            let b = data[i + 2];
            let a = data[i + 3];
            if(options.removeNoiseValue){
                r = Math.ceil(r/options.removeNoiseValue)*options.removeNoiseValue;
                g = Math.ceil(g/options.removeNoiseValue)*options.removeNoiseValue;
                b = Math.ceil(b/options.removeNoiseValue)*options.removeNoiseValue;
            }
            const lightness = this.getPerceivedLightness_approx(r, g, b);
            const lightnessWithAlpha = Math.min(lightness, a); // Alpha reduces lightness
            
            //Update min and max lightness
            if (lightnessWithAlpha < lightnessMin) lightnessMin = lightnessWithAlpha;
            if (lightnessWithAlpha > lightnessMax) lightnessMax = lightnessWithAlpha;
            
            // Count alpha and opaque pixels
            if (a < 255) alphaCounter++;
            if (a === 0) pureAlphaCounter++;
            
            // Aggregate lightness stats
            totalLightnessSum += lightnessWithAlpha;
            totalLightnessCounter++;
            uniqueLightnessValues.add(lightnessWithAlpha);
            
            if (a === 255) {
                const colorKey = `${r}-${g}-${b}`;
                uniqueOpaqueColors.add(colorKey);
            }
            
            let local_is_photo = (pixelCount / uniqueOpaqueColors.size <= this.trigger_ratio_size_number_colors &&
                pixelCount / uniqueLightnessValues.size <= this.trigger_ratio_size_number_lightness_photo) &&
                !(gradientLinesCount >= 3 || fullyTransparentLinesCount >= 3);
                
                if(local_is_photo){
                    return {is_photo:true,uniqueOpaqueColors,uniqueLightnessValues,pixelCount,local_is_photo,stoppedAT:i/4, stoppedPercent: Math.round( ((i/4)/pixelCount)*100)};
                }
            }
            
            // Calculate ratios
            const transparencyRatio = pureAlphaCounter / pixelCount;
            const alphaRatio = alphaCounter / pixelCount;
            const averageLightness = totalLightnessSum / totalLightnessCounter;
            const contrast = ( lightnessMax - lightnessMin ) / 255;
            
            
            // Save and return the final result
            return  {
                is_photo:false,
                statistics: {
                    alphaRatio, // ratio of pixels with alpha < 255
                    alphaCounter, // number of pixels with alpha < 255
                    averageLightness, // average lightness of all pixels
                    contrast, // contrast of the image (difference between min and max lightness) normalized to 0-1
                    transparencyRatio, // ratio of pixels with alpha = 0
                    minLightness: lightnessMin, // minimum lightness value
                    pureAlphaCounter, // number of pixels with alpha = 0
                    maxLightness: lightnessMax, // maximum lightness value
                    uniqueOpaqueColors, // unique opaque colors
                    uniqueLightnessValues, // unique lightness values
                    gradientLinesCount,     // number of lines with a gradient
                    fullyTransparentLinesCount, // number of lines with full transparency
                    totalLightnessSum, // sum of all lightness values
                    totalLightnessCounter, // number of lightness values
                }
            };
            
        };
        analyseSlices( sliceCountX,sliceCountY ,maxSliceWidth, maxSliceHeight,options={
            shuffleSlices:true,
            sliceminWidth:0,
            sliceminHeight:0,
        }) {
            const imageBitmap = this.imageBitmap;
            sliceCountX = imageBitmap.width < options.sliceminWidth ? 1 : sliceCountX;
            sliceCountY = imageBitmap.height < options.sliceminHeight ? 1 : sliceCountY;
            
            const [argsToSliceGrid, sliceWidth, sliceHeight]=this.getGridCutArguments(imageBitmap, sliceCountX, sliceCountY);
            const canvas = new OffscreenCanvas(maxSliceWidth, maxSliceHeight);
            const ctx = canvas.getContext('2d',/* {willReadFrequently:true} is a exiting option, but needs benchmarking */); 
            
            let uniqueOpaqueColors = new Set();
            let uniqueLightnessValues = new Set();
            let alphaCounter = 0;
            let pureAlphaCounter = 0;
            let lightnessMin = Infinity;
            let lightnessMax = -Infinity;
            let gradientLinesCount = 0;
            let fullyTransparentLinesCount = 0;
            let totalLightnessSum = 0;
            let totalLightnessCounter = 0;
            let slicesPixelsCount = 0;
            
            if(options.shuffleSlices){
                argsToSliceGrid.sort(() => Math.random() - 0.5);
            }
            
            for (const sliceArg of argsToSliceGrid) {
                const { startX, startY, endX, endY, sliceID } = sliceArg;
                const sliceWidth = endX - startX;
                const sliceHeight = endY - startY;
                
                const minimalSliceWidth = Math.min(sliceWidth, maxSliceWidth);
                const minimalSliceHeight = Math.min(sliceHeight, maxSliceHeight);
                ctx.drawImage(imageBitmap, startX, startY, sliceWidth, sliceHeight, 0, 0, minimalSliceWidth, minimalSliceHeight);
                const sliceImageData = ctx.getImageData(0, 0, minimalSliceWidth, minimalSliceHeight);
                // Analyze the slice
                const sliceResult = this.analyseOneSlice(sliceImageData);
                slicesPixelsCount += sliceImageData.data.length / 4;
                if(sliceResult.is_photo){
                    console.log("Image", "analyseSlices","Photo detected",options.details.url,options.details.requestId, sliceID, sliceArg, sliceResult ) 
                    sliceResult.photoDetectedAt = sliceArg;
                    sliceResult.argsToSliceGrid=argsToSliceGrid;
                    return sliceResult;
                }
                const sliceStats = sliceResult.statistics;
                
                console.log("Image", "analyseSlice", slicesPixelsCount,sliceImageData,options,options.details.url,options.details.requestId, sliceID, sliceArg, sliceStats)
                // Update the global stats
                uniqueOpaqueColors.unionFast(sliceStats.uniqueOpaqueColors);
                uniqueLightnessValues.unionFast(sliceStats.uniqueLightnessValues);
                alphaCounter += sliceStats.alphaCounter;
                pureAlphaCounter += sliceStats.pureAlphaCounter;
                lightnessMin = Math.min(lightnessMin, sliceStats.minLightness);
                lightnessMax = Math.max(lightnessMax, sliceStats.maxLightness);
                gradientLinesCount += sliceStats.gradientLinesCount;
                fullyTransparentLinesCount += sliceStats.fullyTransparentLinesCount;
                totalLightnessSum += sliceStats.totalLightnessSum;
                totalLightnessCounter += sliceStats.totalLightnessCounter;
                
                
            }
            console.log("Image", "analyseSlices","Standard image",options.details.url,options.details.requestId,this.imageData  )
            
            
            // Calculate ratios
            const transparencyRatio = pureAlphaCounter / slicesPixelsCount;
            const alphaRatio = alphaCounter / slicesPixelsCount;
            const averageLightness = totalLightnessSum / totalLightnessCounter;
            const uniqueColors = uniqueOpaqueColors.size;
            const contrast = ( lightnessMax - lightnessMin ) / 255;
            //return stats:
            return {
                is_photo:false, // its not a photo
                argsToSliceGrid, // the slices grid tha served to slice image {startX, startY, endX, endY, sliceID,xID:j,yID:i} to analyse it further
                statistics: {
                    alphaRatio, 
                    averageLightness,
                    contrast,
                    uniqueOpaqueColors,
                    uniqueLightnessValues,
                    transparencyRatio,
                    minLightness: lightnessMin,
                    pureAlphaCounter,
                    maxLightness: lightnessMax,
                    uniqueColors,
                    gradientLinesCount,
                    fullyTransparentLinesCount,
                    totalLightnessSum,
                }
            }; 
        }
        
        
        checkGradientsAndTransparency(imageData) {
            const { width, height, data } = imageData;
            const tolerance = 10; // Tolerance for noise in gradient and transparency detection
            let gradientCount = 0;
            let fullyTransparentLines = 0;
            
            // Helper function to check if a line is a gradient
            const isLineGradient = (line) => {
                let gradientDetected = true;
                let previousLightness = this.getPerceivedLightness_approx(data[line[0]], data[line[1]], data[line[2]]);
                for (let i = 4; i < line.length; i += 4) {
                    const r = data[line[i]];
                    const g = data[line[i + 1]];
                    const b = data[line[i + 2]];
                    const lightness = this.getPerceivedLightness_approx(r, g, b);
                    if (Math.abs(lightness - previousLightness) > tolerance) {
                        gradientDetected = false;
                        break;
                    }
                    previousLightness = lightness;
                }
                return gradientDetected;
            };
            
            // Helper function to check if a line is fully transparent
            const isLineTransparent = (line) => {
                return line.every((_, i) => i % 4 === 3 && data[line[i]] <= tolerance);
            };
            
            // Key lines to check
            const lines = {
                left: Array.from({ length: height }, (_, i) => (i * width * 4)),
                right: Array.from({ length: height }, (_, i) => (i * width * 4) + (width - 1) * 4),
                top: Array.from({ length: width }, (_, i) => i * 4),
                bottom: Array.from({ length: width }, (_, i) => (height - 1) * width * 4 + i * 4),
                centerHorizontal: Array.from({ length: width }, (_, i) => (Math.floor(height / 2) * width * 4) + i * 4),
                centerVertical: Array.from({ length: height }, (_, i) => (i * width * 4) + Math.floor(width / 2) * 4)
            };
            
            // Check each key line for gradients and transparency
            for (const line of Object.values(lines)) {
                if (isLineGradient(line)) {
                    gradientCount++;
                }
                if (isLineTransparent(line)) {
                    fullyTransparentLines++;
                }
            }
            
            return {
                gradients: gradientCount,
                transparentLines: fullyTransparentLines
            };
        }
        
        isGrayscale(sampleSize = 100, tolerance = 0,ctx) {
            
            const width = this.offscreenCanvas.width;
            const height = this.offscreenCanvas.height;
            if(!ctx){  ctx = this.ctx;}
            
            for (let i = 0; i < sampleSize; i++) {
                // Pick a random point
                const x = Math.floor(Math.random() * width);
                const y = Math.floor(Math.random() * height);
                
                // Get the pixel data
                const pixel = ctx.getImageData(x, y, 1, 1).data;
                const [r, g, b] = pixel;
                
                // Check if the pixel is not grayscale within the tolerance
                if (Math.abs(r - g) > tolerance || Math.abs(g - b) > tolerance || Math.abs(r - b) > tolerance) {
                    return false; // If any pixel is colored beyond tolerance, return false
                }
            }
            
            return true; // All sampled pixels were grayscale within the tolerance
        }
    }
    
    
    let imageBuffers = [];
    console.log = (...args) => {
        for (let i = 0; i < args.length; i++) {
            if (typeof args[i] == "function") {
                args[i] = args[i].name;
            }
            
            if (typeof args[i] == "object") {
                if (args[i].name) {
                    args[i] = args[i].name;
                }
                // args[i]=JSON.stringify(args[i]);
            }
        }
        postMessage({
            logMessage: args
        })
    }
    // console.log = () => {};
    console.log("Image Service worker started")
    
    var uDark = {
        transformImage(imageDataClamped8TMP, transformationFunction) {
            const pixels=this.imageData.data;
            for (let pixelIndex = 0; pixelIndex < this.imageData.data.length; pixelIndex += 4) {
                const r = pixels[pixelIndex];
                const g = pixels[pixelIndex + 1];
                const b = pixels[pixelIndex + 2];
                const a = pixels[pixelIndex + 3];
                const [rx, gx, bx, ax] = transformationFunction(r, g, b, a);
                imageDataClamped8TMP[pixelIndex] = rx;
                imageDataClamped8TMP[pixelIndex + 1] = gx;
                imageDataClamped8TMP[pixelIndex + 2] = bx;
                imageDataClamped8TMP[pixelIndex + 3] = ax;
                
            }
        },
        cachePrototypeMethods: function(targetClass) {
            const prototype = targetClass.prototype;
            
            // Iterate over all properties in the prototype
            Object.getOwnPropertyNames(prototype).forEach((methodName) => {
                const originalMethod = prototype[methodName];
                
                // Ensure that we only wrap functions
                if (typeof originalMethod === 'function' && methodName !== 'constructor') {
                    prototype[methodName] = function(...args) {
                        // Use a symbol to store the cache, unique to this instance and method
                        const cacheKey = Symbol.for(methodName);
                        
                        // Check if the result is already cached
                        if (!this[cacheKey]) {
                            // If not cached, call the original method with args and store the result
                            this[cacheKey] = originalMethod.apply(this, args);
                        }
                        
                        // Return the cached result
                        return this[cacheKey];
                    };
                }
            });
        },
        background_match: /background|sprite|(?<![a-z])(bg|box|panel|fond|fundo|bck)(?![a-z])/i,
        logo_match: /nav|avatar|logo|icon|alert|notif|cart|menu|tooltip|dropdown|control/i,
        RGBToLinearLightness: (r, g, b) => {
            return (Math.max(r, g, b) + Math.min(r, g, b)) / 2;
        },
        
        getPerceivedLightness_approx(r, g, b) {
            return (0.299 * r + 0.587 * g + 0.114 * b);
        },
        trigger_ratio_size_number_colors: 393,
        trigger_ratio_size_number_lightness_photo: 9835,
        
        is_photo: (targetBitmap, editionStatus) => {
            console.log(targetBitmap, targetBitmap.width, targetBitmap.height, "is_photo")
            const canvas = new OffscreenCanvas(targetBitmap.width, targetBitmap.height);
            const ctx = canvas.getContext('2d',/* {willReadFrequently:true} is a exiting option, but needs benchmarking */); 
            ctx.drawImage(targetBitmap, 0, 0);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            let pixelCount = data.length / 4;
            
            let opaqueColorCounter = new Set();
            let lightnessCounter = new Set();
            
            let trigger_ratio_size_number_lightness_photo = uDark.trigger_ratio_size_number_lightness_photo;
            let trigger_ratio_size_number_colors = uDark.trigger_ratio_size_number_colors;
            
            if (editionStatus.isGrayscale) {
                trigger_ratio_size_number_lightness_photo = trigger_ratio_size_number_lightness_photo * 2;
                trigger_ratio_size_number_colors = trigger_ratio_size_number_colors * 2;
            }
            
            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                const a = data[i + 3];
                let number = ((a << 24)) | (b << 16) | (g << 8) | r
                
                lightnessCounter.add(number)
                if (a == 255) {
                    opaqueColorCounter.add(number);
                }
                let is_photo = pixelCount / opaqueColorCounter.size <= trigger_ratio_size_number_colors &&
                pixelCount / lightnessCounter.size <= trigger_ratio_size_number_lightness_photo;
                if (is_photo) {
                    return true;
                }
            }
            return false;
        },
        is_photo_stat: async function(editionStatus, sourceBitmap, details) {
            let targetGrid = 50;
            let targetGridCount = 5;
            let targetGridWidth = targetGrid * targetGridCount;
            let resizeWidth = Math.min(sourceBitmap.width, targetGridWidth),
            resizeHeight = Math.min(sourceBitmap.height, targetGridWidth);
            
            const targetBitmap = await createImageBitmap(sourceBitmap, 0, 0, sourceBitmap.width, sourceBitmap.height, {
                resizeWidth,
                resizeHeight
            });
            
            const isGrayscaleImage = uDark.isGrayscale(targetBitmap, details);
            
            editionStatus.isGrayscale = isGrayscaleImage;
            console.log("Image", "is_photo_stat isGrayscale", details.url, details.requestId, editionStatus.isGrayscale)
            
            if (resizeHeight == targetGridWidth && resizeWidth == targetGridWidth) {
                
                for (let row = 0; row < targetGridCount; row++) {
                    for (let col = 0; col < targetGridCount; col++) {
                        
                        console.log("Image", "is_photo_stat isGrayscale", details.url, details.requestId, editionStatus.isGrayscale, row, col)
                        let testBitmap = await createImageBitmap(targetBitmap, col * targetGrid, row * targetGrid, targetGrid, targetGrid);
                        let is_photo = uDark.is_photo(testBitmap, editionStatus);
                        if (is_photo) {
                            
                            console.log("Image", "is_photo_stat isPhotoYes", details.url, details.requestId, editionStatus.isGrayscale, testBitmap)
                            return true;
                        }
                    }
                }
            } else {
                return uDark.is_photo(targetBitmap, editionStatus);
            }
            // Use the targetBitmap for further processing
            
            return false;
        },
        isGrayscale: (target, tolerance = 4) => {
            let data = target.data;
            
            // If 'data' is not directly provided, extract it from the target using OffscreenCanvas
            if (!data) {
                const canvas = new OffscreenCanvas(target.width, target.height);
                const ctx = canvas.getContext('2d',/* {willReadFrequently:true} is a exiting option, but needs benchmarking */); 
                ctx.drawImage(target, 0, 0);
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                data = imageData.data;
            }
            
            // Loop through the pixels, checking if each one is grayscale
            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                
                // Check if the difference between the channels exceeds the tolerance
                if (Math.abs(r - g) > tolerance || Math.abs(r - b) > tolerance || Math.abs(g - b) > tolerance) {
                    return false;
                }
            }
            
            return true;
        },
        logo_image_edit_hook: function( editionStatus,imageNormalizer,details,complement,imageURLObject) {
            
            const imageData=imageNormalizer.imageData;
            const imageBitmap=imageNormalizer.imageBitmap;
            const ctx=imageNormalizer.ctx;
            const offscreenCanvas=imageNormalizer.offscreenCanvas;
            
            let start_date = new Date();
            console.log("Logos", "Entering edition", details.url, details.requestId, editionStatus)
            
            
            let editionConfidence = 0 + (editionStatus.editionConfidenceLogo);
            // Draw the image onto the canvas
            editionStatus.is_photo = editionStatus.imageNormalizerAnalysis.is_photo;
            const photoStats = editionStatus.imageNormalizerAnalysis.statistics;
            editionStatus.edited = true;
            console.log("Logos", details.url, details.requestId, photoStats);
            // ctx.fillStyle = "white";
            // ctx.fillRect(0,0,offscreenCanvas.width,offscreenCanvas.height);
            // return
            
            if (editionStatus.is_photo && !editionConfidence > 100) {
                return false;
            }
            
            let theImageDataBufferTMP = new ArrayBuffer(imageData.data.length);
            let theImageDataClamped8TMP = new Uint8ClampedArray(theImageDataBufferTMP)
            
            
            switch (!editionStatus.is_photo && editionConfidence < 100) {
                case true:
                
                console.log("Logos", "Checking the light edition", details.url, details.requestId)
                if (!photoStats.uniqueColors > 1) {
                    break;
                }
                if (photoStats.transparencyRatio < 0.1) {
                    return;
                }
                
                let max_bright_trigger = 255 * 0.4;
                if (photoStats.minLightness > max_bright_trigger) {
                    return;
                }
                
                if (photoStats.contrast > .70) {
                    console.log("Logos", "Puting a shadow", details.url, details.requestId)
                    theImageDataClamped8TMP.set(imageData.data);
                    uDark.transformImage(theImageDataClamped8TMP, function(r, g, b, a) {
                        
                        let lightness = (Math.max(r, g, b, 255 - a) + Math.min(r, g, b, 255 - a)) / 2;
                        if (lightness < 25) {
                            return [255, 255, 255, 255];
                        }
                        return [0, 0, 0, 0];
                    });
                    
                    console.log("Logos", details.url, details.requestId, "Shadow added in", new Date() / 1 - start_date / 1,imageData.data[532303]);
                    imageData.data.set(theImageDataClamped8TMP);
                    console.log("Logos", details.url, details.requestId, "Shadow added in", new Date() / 1 - start_date / 1,theImageDataClamped8TMP[532303]);
                    
                    ctx.putImageData(imageData, 0, 0);
                    ctx.filter = "blur(3px)";
                    let resource = offscreenCanvas;
                    let options = {
                        viaBitmap: false,
                        repetitions: 5
                    };
                    if (options.viaBitmap) {
                        resource = offscreenCanvas.transferToImageBitmap();
                    }
                    // ctx.fillStyle = "yellow";
                    // ctx.fillRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);
                    for (let i = 0; i < options.repetitions; i++) {
                        ctx.drawImage(resource, 0, 0);
                    }
                    ctx.filter = "none";
                    ctx.drawImage(imageBitmap, 0, 0);
                    
                    editionStatus.edited = true
                    return true;
                    // ADD SHADOW TO IMAGE PARTS WITH LIGHTNESS < 25
                    // Note 25 is < 100-70 there is no conflict with the previous condition
                }
            }
            // let theImageDataBufferTMP = new ArrayBuffer(imageData.data.length);
            // let theImageDataClamped8TMP = new Uint8ClampedArray(theImageDataBufferTMP);
            // theImageDataClamped8TMP.set(imageData.data);
            // let theImageDataUint32TMP = new Uint32Array(theImageDataBufferTMP) // Id prefer ro use imageData directly but i don't knwo why i cant do it yet
            // // let theImageDataUint32TMP = new Uint32Array(imageData.data);
            
            // // Now you can work with the imageData object
            // // console.log(imageData, img.src);
            
            // // The imageData object has a data property, a Uint8ClampedArray containing the color values of each pixel in the image.
            // // It is easier to work with this array as 32-bit integers, so we create a new Uint32Array from the original one
            // let n = theImageDataUint32TMP.length;
            
            
            console.log("Logos", details.url, details.requestId, "Logo edited in", new Date() / 1 - start_date / 1);
            // Pro tip Reset the image at any time : theImageDataClamped8TMP.set(imageData.data);
            if (!editionStatus.edited) {
                uDark.transformImage(theImageDataClamped8TMP, function(r, g, b, a) {
                    let lightness = uDark.getPerceivedLightness_approx(r, g, b);
                    let lightenUnder = 127;
                    let edit_under_lightness = 100;
                    if (lightness < lightenUnder && lightness < edit_under_lightness) {
                        // [r,g,b]=[r,g,b].map((x)=>x/2);
                        [r, g, b] = [r, g, b].map((x) => {
                            x = x + Math.pow(
                                (lightenUnder - lightness) // The less the lightness the more the color is lightened
                                , 1 + .11); // Increase the lightening effect a bit
                                return x;
                                
                            });
                        }
                        return [r, g, b, a];
                    });
                    
                    imageData.data.set(theImageDataClamped8TMP);
                    ctx.putImageData(imageData, 0, 0);
                }
                console.log("Logos", details.url, details.requestId, "Put back in context", new Date() / 1 - start_date / 1);
                editionStatus.edited = true;
                
                return true;
            },
            background_image_edit_hook: function(editionStatus, canvas, ctx, imageBitmap, imageData, details, imageURLObject, complement) {
                return false;
                let editionConfidence = 0 + (editionStatus.editionConfidenceBackground);
                let start_date = new Date();
                console.log("Background", "Entering edition", details.url, details.requestId, editionStatus)
                
                // Refuse bacground images on certain conditions
                uDark.disableBackgroundPostCheck = true;
                if (!uDark.disableBackgroundPostCheck) {
                    if (
                        complement.has("width") && !complement.get("width").includes("%") && complement.get("width").startsWith(imageBitmap.width) // We fetched the image with the same size as the element
                        ||
                        complement.has("height") && !complement.get("height").includes("%") && complement.get("height").startsWith(imageBitmap.height) // We fetched the image with the same size as the element
                    ) {
                        return false;
                    }
                    
                    if (complement.has("uDark_backgroundRepeat") && /repeat|round|space/i.test(complement.get("uDark_backgroundRepeat").replaceAll("no-repeat", "")) ||
                    complement.has("alt") && /background/i.test(complement.get("alt"))
                    
                ) {
                    editionConfidence += 200;
                }
                
            }
            const photoProbaObject =  editionStatus.photoProbabilities
            = editionStatus.photoProbabilities
            || new uDark.PhotoEvaluator(imageData.data, canvas.width, canvas.height);
            let theImageDataBufferTMP = new ArrayBuffer(imageData.data.length);
            let theImageDataClamped8TMP = new Uint8ClampedArray(theImageDataBufferTMP)
            
            
            const photoScore = photoProbaObject.analyzeImage(theImageDataClamped8TMP, function(r, g, b, a) {
                
                let lightness = uDark.getPerceivedLightness_approx(r, g, b);
                
                // Standard way 2023 // very very very slow (1.5s for a 500 x 500 img)
                // 2024 way : Go faster by finding the right caclulation for each pixel
                // [r, g, b, a] = uDark.revert_rgba(r, g, b, a, (...args) => args);
                if (lightness > 127) {
                    // [r,g,b]=[r,g,b].map((x)=>x/2);
                    [r, g, b] = [r, g, b].map((x) => {
                        
                        x = x * Math.pow(
                            255 / (lightness + 127), // The more the lightness is high, the more the color is darkened
                            lightness / 127 * 2.8 // The more the lightness is high, the more the darkeing is strong
                        );
                        
                        return x;
                        
                    });
                }
                return [r, g, b, a];
            });
            
            const photoStats = photoScore.statistics;
            console.log("Background", "Photo score", photoScore, details.url, details.requestId, theImageDataClamped8TMP[0])
            console.log('This image is likely a photo:', photoScore.finalScore.toFixed(2), details.url, details.requestId, photoScore);
            editionStatus.is_photo = photoScore.finalScore > uDark.photoThreshold;
            if (editionStatus.is_photo && editionConfidence < 100) {
                return false;
            }
            if (!editionStatus.is_photo && editionConfidence < 100) {
                if (photoStats.contrast > 0.77 &&
                    photoStats.averageLightness > 220 &&
                    photoStats.maxLightness >= 204
                ) {
                    ctx.filter = "invert(0.9) hue-rotate(180deg)";
                    ctx.drawImage(imageBitmap, 0, 0);
                    editionStatus.edited = true;
                } else if (photoStats.uniqueColors > 1) {
                    if (photoStats.transparencyRatio > 0.1 && !(photoStats.alphaRatio > .5)) {
                        console.log("Background", details.url, details.requestId, "Probable background having transparency")
                        return false; // Not a background : Too much pure alpha pixels
                    }
                    let min_bright_trigger = 255 * 0.4;
                    if (photoStats.averageLightness < min_bright_trigger && photoStats.maxLightness < min_bright_trigger) {
                        editionStatus.probable_dark_background_having_contrast = true;
                        console.log("Background", details.url, details.requestId, "Probable dark background having contrast")
                        return false; // If its a background, i'ts already a dark one, and it has no contrast elements, no need to darken it more
                    }
                    if (photoStats.contrast > 0.45 && photoStats.averageLightness > 127 || photoStats.contrast > 0.60) {
                        console.log("Background", details.url, details.requestId, "Probable bright background having contrast")
                        // return false; // This image is bright but seems to have contrast elements, if we darken it we will loose these elements
                    }
                }
            }
            // Draw the image onto the canvas
            console.log("Background", details.url, details.requestId, "Background edited in", new Date() / 1 - start_date / 1);
            // Pro tip Reset the image at any time : theImageDataClamped8TMP.set(imageData.data);
            if (!editionStatus.edited) {
                imageData.data.set(theImageDataClamped8TMP);
                ctx.putImageData(imageData, 0, 0);
            }
            console.log("Background", details.url, details.requestId, "Put back in context", new Date() / 1 - start_date / 1);
            editionStatus.edited = true;
            
            return true;
        },
        edit_an_image: async function(details) {
            
            details.requestId = details.url.split('').map(v => v.charCodeAt(0)).reduce((a, v) => a + ((a << 7) + (a << 3)) ^ v).toString(16);
            let editionStatus = {
                edited: false,
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
            
            if (uDark.background_match.test(imageURLObject.search + complement.get("class") + complement.get("uDark_cssClass"))) {
                editionStatus.editionConfidenceBackground = 100;
                edition_order_hooks = [uDark.background_image_edit_hook];
            }
            if (
                complement.has("inside_clickable") ||
                uDark.logo_match.test(imageURLObject.search + complement.get("class") + complement.get("uDark_cssClass"))
            ) {
                
                edition_order_hooks = [uDark.logo_image_edit_hook];
            }
            
            if (!edition_order_hooks.length) {
                return {}
            }
            
            console.log("Image", "Editing image", details.fromCache, details.url, details.requestId, details.isDataUrl);
            
            // Do the common tasks required for all edited images
            let start_date = new Date();
            
            console.log("Image", "Filter has stopped", new Date() / 1 - start_date / 1, details.url, details.requestId);
            // NOTE: TODO: Improve: If the image has a 404 state the server returns html, and canvas can't draw it and loose at least 3 seconds understanding it
            if (details.statusCode && details.statusCode >= 400) {
                return editionStatus;
            }
            
            // let blob = {
            //   arrayBuffer: x => ({
                //     then: x => details.dataUrl
            //   })
            // }
            
            let blob = (new Blob(imageBuffers));
            console.log("Image", "Blob created", new Date() / 1 - start_date, details.url, details.requestId)
            let imageBitmap;
            try {
                
                imageBitmap = await createImageBitmap(blob);
            } catch (e) {
                console.log("Image", "Invalid or disposed image", new Date() / 1 - start_date, details.url, details.requestId)
                // Invalid or disposed image.
                return editionStatus;
                
            }
            // blob.arrayBuffer().then((buffer) => {
                {
                
                console.log("Image", "created ImageBitmap", new Date() / 1 - start_date, details.url, details.requestId)
                // Create an Image object
                
                // const reader = new FileReader() // Faster but ad what cost later ? 
                // // 2. Add a handler for the 'onload' event
                // reader.onload = (e) => {
                    //     // 5. Get the result when the 'onload' event is triggered.
                //     const base64data = reader.result               
                //     console.log("Image to base 64",new Date() / 1 - start_date,details.url,details.requestId,{base64data});
                //     img.src = base64data;
                // }
                // // 3. Add a handler for the 'onerror' event
                // reader.onerror = () => {                
                    //     console.log('error')
                // }
                // // // 4. Call 'readAsDataURL' method
                
                // reader.readAsDataURL(blob)
                
                let imageNormalizer = new ImageNormalizer(imageBitmap);
                const offscreenCanvas = imageNormalizer.offscreenCanvas;
                imageNormalizer.ctx.ready=1
                // let analysis = imageNormalizer.analyseSlices(6,5,300,300,{
                //     shuffleSlices:false,sliceminHeight:100,sliceminWidth:100,details
                // });
                let analysis = imageNormalizer.detectPhoto({
                    gridColumns: 6,
                    gridRows: 5,
                    earlyExitThreshold: 0.8,
                    lineCheckOptions: {
                        checkCenterLines: true,
                        checkBorderLines: true
                    }
                });
                
                uDark.debug_is_photo = true;
                if(analysis.is_photo&& uDark.debug_is_photo){
                    imageNormalizer.ctx.fillStyle="rgba(255,0,0,.5)";
                    const {startX,startY,endX,endY}=analysis.photoDetectedAt;
                    imageNormalizer.ctx.fillRect(startX,startY,endX-startX,endY-startY);
                    editionStatus.edited=true;
                    //given the array [{ startX, startY, endX, endY, sliceID },...] in analysis.argsToSliceGrid, draw a grid on the image
                    
                }
                if(uDark.debug_is_photo){
                    for (const sliceArg of analysis.argsToSliceGrid) {
                        const { startX, startY, endX, endY, sliceID } = sliceArg;
                        imageNormalizer.ctx.strokeStyle = "rgba(0,255,.5)";
                        imageNormalizer.ctx.lineWidth = 1;
                        imageNormalizer.ctx.strokeRect(startX, startY, endX - startX, endY - startY);
                    }
                    editionStatus.edited=true;
                }
                console.log("Image", "Analysis done",details.requestId,details.url,analysis)
                editionStatus.imageNormalizerAnalysis = analysis;
                editionStatus.is_photo = analysis.is_photo;
                // Get the ImageData from the canvas
                for (let imageEditionHook of edition_order_hooks) {
                    if (editionStatus.edited === false) {
                        
                        console.log("Image edition hook", imageEditionHook, new Date() / 1 - start_date, details.url, details.requestId)
                        imageEditionHook( editionStatus,imageNormalizer,details,complement,imageURLObject );
                        console.log("Image acceptance", editionStatus.edited, imageEditionHook, new Date() / 1 - start_date, details.url, details.requestId)
                    }
                }
                if (editionStatus.edited === true) {
                    
                    console.log("Image", "Going blob", new Date() / 1 - start_date / 1, details.url, details.requestId);
                    let editedBlobWithImageHeaders = await offscreenCanvas.convertToBlob();
                    let buffer = await editedBlobWithImageHeaders.arrayBuffer();
                    
                    console.log("Image", "Canvas to blob done", new Date() / 1 - start_date / 1, details.url, details.requestId);
                    console.log("Image", "Blob to arraybuffer", new Date() / 1 - start_date / 1, details.url, details.requestId);
                    
                    editionStatus.editedBuffer = buffer;
                    console.log("Image", "Image written in filter having edited it", new Date() / 1 - start_date / 1, details.url, details.requestId);
                }
                
                return editionStatus;
                
            };
            
        }
        
    }
    
    onmessage = async (e) => {
        if (e.data.oneImageBuffer) {
            imageBuffers.push(e.data.oneImageBuffer);
        }
        if (e.data.filterStopped) {
            
            let editionResult = {};
            
            editionResult = await uDark.edit_an_image(e.data.details);
            if (editionResult.editedBuffer) {
                imageBuffers = [editionResult.editedBuffer];
            }
            
            console.log("Sending back", imageBuffers, editionResult.editedBuffer);
            postMessage({
                editionComplete: 1,
                buffers: imageBuffers
            }, imageBuffers);
            
            console.log("filter stopped");
            imageBuffers = [];
        }
    };