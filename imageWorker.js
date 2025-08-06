let imageBuffers = [];
let activeMessageLogging = false;
// console.log=(...args)=>{
  
//         for (let i = 0; i < args.length; i++) {
//             if(typeof args[i]=="function")
//             {
//                 args[i]=args[i].name;
//             }
            
            
//             if(typeof args[i]=="object")
//             {
//                 if(args[i].name)
//                 {
//                     args[i]=args[i].name;
//                 }
//                 // args[i]=JSON.stringify(args[i]);
//             }
//         }
//     postMessage({logMessage:args})
//     // setTimeout(() => {
//     //     for (i = 0; i < args.length; i++) {
//     //         if(typeof args[i]=="undefined")
//     //         {   

//     //             args[i]="undefined";
//     //         }
//     //         if(args[i].name)
//     //         {
//     //             args[i]=args[i].name;
//     //         }
//     //         if (typeof args[i] == "object") {
//     //             args[i] = JSON.stringify(args[i]);
//     //         }
//     //         args[i] = args[i] + "";
//     //     }
//     //     throw new Error("MESSAGE FROM WORKER " + args.join("  --  "));
//     // }, 0);
// }
if(!activeMessageLogging)
{
  console.log =()=>undefined
}

console.log("Image Service worker started")


var uDark={
    background_match:/background|sprite|(?<![a-z])(bg|box|panel|fond|fundo|bck)(?![a-z])/i,
    logo_match: /nav|avatar|logo|icon|alert|notif|cart|menu|tooltip|dropdown|control/i,
    RGBToLightness: (r, g, b) => {
        return (Math.max(r, g, b) + Math.min(r, g, b)) / 2;
      },
    trigger_ratio_size_number_colors: 393,
    trigger_ratio_size_number_lightness_photo: 9835,

    is_photo:(targetBitmap,editionStatus)=> {
      console.log(targetBitmap,targetBitmap.width, targetBitmap.height, "is_photo")
      const canvas = new OffscreenCanvas(targetBitmap.width, targetBitmap.height);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(targetBitmap, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      let pixelCount = data.length / 4;
      
      let opaqueColorCounter = new Set();
      let lightnessCounter = new Set();

      let trigger_ratio_size_number_lightness_photo=uDark.trigger_ratio_size_number_lightness_photo;
      let trigger_ratio_size_number_colors=uDark.trigger_ratio_size_number_colors;

      if(editionStatus.isGrayscale)
      {
        trigger_ratio_size_number_lightness_photo=trigger_ratio_size_number_lightness_photo*2;
        trigger_ratio_size_number_colors=trigger_ratio_size_number_colors*2;
      }

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];
        let number= ((a << 24)) | (b << 16) | (g << 8) | r
        
        lightnessCounter.add(number)
        if(a==255){
          opaqueColorCounter.add(number);
        }
        let is_photo = pixelCount/opaqueColorCounter.size <= trigger_ratio_size_number_colors
        && pixelCount/lightnessCounter.size <= trigger_ratio_size_number_lightness_photo;
        if(is_photo)
        {
          return true;
        }
      }
      return false;
    },
    is_photo_stat: async function(editionStatus, sourceBitmap,details) {
      let targetGrid=50;
      let targetGridCount=5;
      let targetGridWidth=targetGrid*targetGridCount;
      let resizeWidth=Math.min(sourceBitmap.width,targetGridWidth),resizeHeight=Math.min(sourceBitmap.height,targetGridWidth);

      const targetBitmap = await createImageBitmap(sourceBitmap, 0, 0, sourceBitmap.width, sourceBitmap.height,{
        resizeWidth,resizeHeight
      });
      
      
      const isGrayscaleImage = uDark.isGrayscale(targetBitmap,details);
      
      editionStatus.isGrayscale = isGrayscaleImage;
      console.log("Image","is_photo_stat isGrayscale",details.url,details.requestId,editionStatus.isGrayscale )

    
      if(resizeHeight==targetGridWidth&&resizeWidth==targetGridWidth)
      {
        
        for (let row = 0; row < targetGridCount; row++) {
          for (let col = 0; col < targetGridCount; col++) {
            
        
      console.log("Image","is_photo_stat isGrayscale",details.url,details.requestId,editionStatus.isGrayscale,row,col )
            let testBitmap=await createImageBitmap(targetBitmap, col*targetGrid, row*targetGrid, targetGrid, targetGrid);
            let is_photo=uDark.is_photo(testBitmap,editionStatus);
            if(is_photo)
            {
        
              console.log("Image","is_photo_stat isPhotoYes",details.url,details.requestId,editionStatus.isGrayscale,testBitmap )
              return true;
            }
          }
        }
      }
      else
      {
        return uDark.is_photo(targetBitmap,editionStatus);
      }
      // Use the targetBitmap for further processing

      return false;
    },

    isGrayscale: (targetBitmap, tolerance=4) => {
      console.log(targetBitmap, targetBitmap.width, targetBitmap.height, "isGrayscale");
      const canvas = new OffscreenCanvas(targetBitmap.width, targetBitmap.height);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(targetBitmap, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        let vmax=Math.max(r, g, b);
        let vmin=Math.min(r, g, b);
        if(vmax-vmin>tolerance)
        {
          return false;
        }
      }
      return true;
    },

    check_image_lines_content: function(canvas, ctx) {
        const leftBorderImageData = ctx.getImageData(0, 0, 1, canvas.height);
        const rightBorderImageData = ctx.getImageData(canvas.width - 1, 0, 1, canvas.height);
        const topBorderImageData = ctx.getImageData(0, 0, canvas.width, 1);
        const bottomBorderImageData = ctx.getImageData(0, canvas.height - 1, canvas.width, 1);
        const centerVerticalLineImageData=ctx.getImageData(canvas.width/2, 0, 1, canvas.height);
        const centerHorizontalLineImageData=ctx.getImageData(0, canvas.height/2, canvas.width, 1);
        let linesAchromatic = Array(10).fill(false);
        let linesGradient = Array(10).fill(false);
        let linesAchromaticCount = 0;
        let linesAchromaticOpaqueCount = 0;
        let linesGradientsCount=0;
        let list_test = [leftBorderImageData, rightBorderImageData, topBorderImageData, bottomBorderImageData,centerVerticalLineImageData,centerHorizontalLineImageData]
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
          let currentLightness=Math.max(uDark.RGBToLightness(r, g, b),a);
          for (let n = 1; n < theImageDataUint32TMP.length; n++) {
            // Start to 1 as we already checked the first pixel
            number = theImageDataUint32TMP[n];
            r = number & 0xff;
            g = (number >> 8) & 0xff;
            b = (number >> 16) & 0xff;
            a = (number >> 24) & 0xff;
            let lightness=Math.max(uDark.RGBToLightness(r, g, b),a);
            if (lightness>currentLightness+5||lightness<currentLightness-5) {
              isGradient = false;
              break;
            }
            currentLightness=lightness;
          }
          if(isGradient)
          {
            linesGradient[i]=true;
            linesGradientsCount++;
          }
        }
        return  {
          linesAchromaticCount,
          linesGradient,
          linesAchromaticOpaqueCount,
          linesAchromatic,
          linesGradientsCount,
          linesWithSomeAlpha:linesAchromaticCount-linesAchromaticOpaqueCount,
          linesFullAlphaCount:linesAchromatic.filter(x=>x[3]==0).length
        }

      },
      logo_image_edit_hook: function(editionStatus, canvas, ctx, img, blob, details, imageURLObject, complement) {

        let start_date = new Date();
        console.log("Logos","Entering edition",details.url,details.requestId,uDark.logo_image_edit_hook)

        let editionConfidence = 0 +(editionStatus.editionConfidenceLogo);
        // Draw the image onto the canvas
        ctx.drawImage(img, 0, 0);
        // Get the ImageData from the canvas
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        // Now you can work with the imageData object
        // console.log(imageData, img.src);

        // The imageData object has a data property, a Uint8ClampedArray containing the color values of each pixel in the image.
        // It is easier to work with this array as 32-bit integers, so we create a new Uint32Array from the original one

        let theImageDataBufferTMP = new ArrayBuffer(imageData.data.length);
        let theImageDataClamped8TMP = new Uint8ClampedArray(theImageDataBufferTMP);
        theImageDataClamped8TMP.set(imageData.data);
        let theImageDataUint32TMP = new Uint32Array(theImageDataBufferTMP) // Id prefet o use imageData bu idont uderstand yet why in can't
        // let theImageDataUint32TMP = new Uint32Array(imageData.data);

        let n = theImageDataUint32TMP.length;

        console.log("Logos","Entering the loop",details.url,details.requestId,"Confidence:",editionConfidence,new Date()/1-start_date/1)
        if (!editionStatus.statsComplete) {
          editionStatus.colorCounter = new Set();
          editionStatus.opaqueColorCounter = new Set();
          editionStatus.opaqueLightnessCounter = new Set();
          editionStatus.lightnessCounter = new Set();
          editionStatus.alphaCounter = new Set();
          editionStatus.lightness_sum = 0;
          editionStatus.opaqueColor_qty = 0;
          editionStatus.opaqueLightness_sum = 0;
          editionStatus.alpha_sum = 0;
          editionStatus.alpha_qty = 0;
        }
        
        console.log("Logo HOOK", "ENTERING LOOP", editionStatus.statsComplete)
        imgDataLoop: while (n--) {

          if (editionStatus.is_photo && !(editionConfidence >= 100)) { // stop the loop if a photo is detected
            theImageDataClamped8TMP.set(imageData.data);
            break imgDataLoop;
          }

          var number = theImageDataUint32TMP[n];

          var r = number & 0xff;
          var g = (number >> 8) & 0xff;
          var b = (number >> 16) & 0xff;
          var a = (number >> 24) & 0xff;
          {
            let lightness = uDark.RGBToLightness(r, g, b);

            if (!editionStatus.statsComplete) {
              editionStatus.colorCounter.add(number);
              let lightnessWithAlpha = Math.min(lightness, a); // Alpha kills lightness
              editionStatus.lightness_sum += lightnessWithAlpha;
              editionStatus.lightnessCounter.add(lightnessWithAlpha);
              editionStatus.alphaCounter.add(a);
              editionStatus.alpha_sum += a;
              if (a == 255) {
                editionStatus.opaqueColorCounter.add(number);
                editionStatus.opaqueLightnessCounter.add(lightness);
                editionStatus.opaqueColor_qty++
                editionStatus.opaqueLightness_sum += lightness;
              } else {
                editionStatus.alpha_qty++;
              }

              editionStatus.is_photo = 
                theImageDataUint32TMP.length/editionStatus.opaqueColorCounter.size <= uDark.trigger_ratio_size_number_colors
                && theImageDataUint32TMP.length/ editionStatus.lightnessCounter.size <= uDark.trigger_ratio_size_number_lightness_photo;
            }
            // Standard way 2023 // very very very slow (1.5s for a 500 x 500 img)
            // 2024 way : Go faster by finding the right caclulation for each pixel
            // [r, g, b, a] = uDark.revert_rgba(r, g, b, a, (...args) => args);
            let lightenUnder=127;
            let edit_under_lightness=100;
            if (lightness < lightenUnder && lightness<edit_under_lightness) {
              // [r,g,b]=[r,g,b].map((x)=>x/2);
              [r, g, b] = [r, g, b].map((x) => {
                x = x + Math.pow(
                  (lightenUnder - lightness) // The less the lightness the more the color is lightened
                  , 1+.11); // Increase the lightening effect a bit
                return x;

              });
            }
          }
          var newColor = ((a << 24)) | (b << 16) | (g << 8) | r;
          theImageDataUint32TMP[n] = newColor;

        }
        if(!editionStatus.statsComplete)
        {
          if(n === -1)
          {
              editionStatus.avg_ligtness = (editionStatus.lightness_sum / theImageDataUint32TMP.length);
              editionStatus.alpha_percent = editionStatus.alpha_qty / theImageDataUint32TMP.length;
              editionStatus.contrast = Math.max(...editionStatus.lightnessCounter) - Math.min(...editionStatus.lightnessCounter);
              editionStatus.contrast_percent = editionStatus.contrast / 255;
              editionStatus.max_lightness = Math.max(...editionStatus.lightnessCounter);
              editionStatus.min_lightness = Math.min(...editionStatus.lightnessCounter);
              editionStatus.statsComplete = true;
          }
          else {
            console.log("Logos","Stat not complete", details.url,details.requestId, editionStatus);
            return false;
          }
        }
         
        
        console.log("Logos",editionStatus.statsComplete,"Confidence:",editionConfidence,new Date()/1-start_date/1,editionStatus,details.requestId,imageData)
        
        if (editionStatus.statsComplete) {

          if (!(editionConfidence >= 100) && !editionStatus.is_photo) {
            if (editionStatus.colorCounter.size > 1) // Not achromatic
            {
              if (editionStatus.alpha_percent < 0.1) {
                return false; // No enough alpha to be an editable logo
              }
              let max_bright_trigger = 255 * 0.4;
              if (editionStatus.min_lightness > max_bright_trigger) {
                return false; // This is a bright image with which does not need lightening, because even the darkest pixel is bright enough
              }
              if (editionStatus.contrast_percent > .70) {
                // ADD SHADOW TO IMAGE PARTS WITH LIGHTNESS < 25
                // Note 25 is < 100-70 there is no conflict with the previous condition
                theImageDataClamped8TMP.set(imageData.data);
                let theImageDataUint32TMP = new Uint32Array(theImageDataBufferTMP)
                let n=theImageDataUint32TMP.length;
                imgDataLoop: while (n--) {
                    var number = theImageDataUint32TMP[n];
                    var r = number & 0xff;
                    var g = (number >> 8) & 0xff;
                    var b = (number >> 16) & 0xff;
                    var a = (number >> 24) & 0xff;
                    var newColor = ((a << 24)) | (b << 16) | (g << 8) | r;
                    let lightness=(Math.max(r, g, b,255-a) + Math.min(r, g, b, 255-a)) / 2;
                    // lightness=Math.min(lightness); // Alpha kills lightness
                    if(lightness<25){
                      number=0xffffffff;
                    }
                    else{
                      number=0x00000000;
                    }
                    theImageDataUint32TMP[n] = number;
                } 
                imageData.data.set(theImageDataClamped8TMP);
                ctx.putImageData(imageData, 0, 0);
                ctx.filter = "blur(3px)";
                let resource=canvas;
                let options={viaBitmap:false,repetitions:5};
                if(options.viaBitmap)
                {
                  resource=canvas.transferToImageBitmap();
                }
                for(let i=0;i<options.repetitions;i++)
                {
                  ctx.drawImage(resource,0,0);
                }
                ctx.filter = "none";
                ctx.drawImage(img, 0, 0);
                editionStatus.edited=true;
                return true;
                //   let shadowImageBitmap = canvas.transferToImageBitmap();
                //   editionStatus.edited=true;
                //   return true;
              //   ctx.drawImage(img, 0, 0);
                
                
              //   // return false;
                                
              //   // ctx.shadowColor = "white";
              //   // ctx.shadowBlur = 10;
                
              //   // ctx.filter = "contrast(0%) brightness(3) blur(3px)"; // White border no matter what
              //  ctx.filter=" grayscale()  invert(1) brightness(0.6) contrast(900%)";
              
              // // ctx.filter = "brightness(3) invert(1) blur(8px) grayscale() hue-rotate(0deg)"; // Can use it to shift a bit the hue, allowing better reading of the text
              //   for (let i = 0; i < 5; i++) {
              //     ctx.drawImage(img, 0, 0);
              //   }
              //   ctx.filter = "none";
              //   //ctx.fillStyle = "red";
              //   //ctx.fillRect(0, 0, canvas.width, canvas.height);
              //   editionStatus.edited=true;
              //   return true;
                
              }

            }

          }

        }

        // Pro tip Reset the image at any time : theImageDataClamped8TMP.set(imageData.data);

        console.log("Logos", details.url,details.requestId, "Logo edited in", new Date() / 1 - start_date / 1);
        imageData.data.set(theImageDataClamped8TMP);

        ctx.putImageData(imageData, 0, 0);
        
        console.log("Logos", details.url,details.requestId, "Put back in context", new Date() / 1 - start_date / 1);
        editionStatus.edited = true;

        return true;

      },
      background_image_edit_hook: function(editionStatus, canvas, ctx, img, blob, details, imageURLObject, complement) {
        let editionConfidence = 0 +(editionStatus.editionConfidenceBackground);
        let start_date = new Date();
        console.log("Background","Entering edition",details.url,details.requestId,uDark.background_image_edit_hook)

        // Refuse bacground images on certain conditions

        if(!uDark.disableBackgroundPostCheck)
        {
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

        // Now you can work with the imageData object
        // console.log(imageData, img.src);

        // The imageData object has a data property, a Uint8ClampedArray containing the color values of each pixel in the image.
        // It is easier to work with this array as 32-bit integers, so we create a new Uint32Array from the original one.
        if (complement.has("uDark_cssClass") && !(editionConfidence >= 100)) {
        let linesColorCheck = uDark.check_image_lines_content(canvas, ctx)
        if ((linesColorCheck.linesAchromaticOpaqueCount > 2 || linesColorCheck.linesGradientsCount > 2)&&linesColorCheck.linesFullAlphaCount==0) {
            editionConfidence += 100;
        }
        editionStatus.linesColorCheck = linesColorCheck;
        }

        // Get the ImageData from the canvas
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        let theImageDataBufferTMP = new ArrayBuffer(imageData.data.length);
        let theImageDataClamped8TMP = new Uint8ClampedArray(theImageDataBufferTMP);
        theImageDataClamped8TMP.set(imageData.data);
        let theImageDataUint32TMP = new Uint32Array(theImageDataBufferTMP) // Id prefet o use imageData bu idont uderstand yet why in can't
        // let theImageDataUint32TMP = new Uint32Array(imageData.data);

        let n = theImageDataUint32TMP.length;
        
        console.log("Background","Entering the loop",details.url,details.requestId,"Confidence:",editionConfidence,new Date()/1-start_date/1,)
        if (!editionStatus.statsComplete) {
          editionStatus.colorCounter = new Set();
          editionStatus.opaqueColorCounter = new Set();
          editionStatus.opaqueLightnessCounter = new Set();
          editionStatus.lightnessCounter = new Set();
          editionStatus.alphaCounter = new Set();
          editionStatus.lightness_sum = 0;
          editionStatus.opaqueLightness_sum = 0;
          editionStatus.alpha_sum = 0;
          editionStatus.alpha_qty = 0;
        }
        imgDataLoop: while (n--) {

          if (editionStatus.is_photo && !(editionConfidence >= 100)) { // stop the loop if a photo is detected
            theImageDataClamped8TMP.set(imageData.data);
            break imgDataLoop;
          }

          var number = theImageDataUint32TMP[n];

          var r = number & 0xff;
          var g = (number >> 8) & 0xff;
          var b = (number >> 16) & 0xff;
          var a = (number >> 24) & 0xff;
          {
            let lightness = uDark.RGBToLightness(r, g, b);

            editionStatus.colorCounter.add(number);
            let lightnessWithAlpha = Math.min(lightness, a); // Alpha kills lightness
            editionStatus.lightness_sum += lightnessWithAlpha;
            editionStatus.lightnessCounter.add(lightnessWithAlpha);
            editionStatus.alphaCounter.add(a);
            editionStatus.alpha_sum += a;
            if (a == 255) {
              editionStatus.opaqueColorCounter.add(number);
              editionStatus.opaqueLightnessCounter.add(lightness);
              editionStatus.opaqueLightness_sum += lightness;
            } else {
              editionStatus.alpha_qty++;
            }
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

            let opaqueColorCounterRatio = theImageDataUint32TMP.length/editionStatus.opaqueColorCounter.size
            let ligthnessCounterRatio = theImageDataUint32TMP.length/editionStatus.lightnessCounter.size
            editionStatus.is_photo = opaqueColorCounterRatio <= uDark.trigger_ratio_size_number_colors
              && ligthnessCounterRatio <= uDark.trigger_ratio_size_number_lightness_photo
              && ligthnessCounterRatio>uDark.trigger_ratio_size_number_lightness_photo*0.07;
            if(editionStatus.is_photo)
            {
              editionConfidence--;
            }
          }
          var newColor = ((a << 24)) | (b << 16) | (g << 8) | r;
          theImageDataUint32TMP[n] = newColor;

        }
        if(!editionStatus.statsComplete)
        {
          if (n === -1) {
            editionStatus.avg_ligtness = (editionStatus.lightness_sum / theImageDataUint32TMP.length);
            editionStatus.alpha_percent = editionStatus.alpha_qty / theImageDataUint32TMP.length;
            editionStatus.contrast = Math.max(...editionStatus.lightnessCounter) - Math.min(...editionStatus.lightnessCounter);
            editionStatus.contrast_percent = editionStatus.contrast / 255;
            editionStatus.max_lightness = Math.max(...editionStatus.lightnessCounter);
            editionStatus.min_lightness = Math.min(...editionStatus.lightnessCounter);
            editionStatus.statsComplete = true;
          } else {
            console.log("Background","Stat not complete", details.url,details.requestId, editionStatus);
            return false;
          }
        }
        // throw new Error(editionStatus.lightnessCounter.size+" "+details.url);
        console.log("Background","Stats complete",editionStatus.statsComplete,details.requestId,"Confidence:",editionConfidence,new Date()/1-start_date/1,editionStatus,imageData)
        
        
        if (editionStatus.statsComplete&&!uDark.disableBackgroundPostCheck) {
          if (!(editionConfidence >= 100) && !editionStatus.is_photo) {

            if (editionStatus.contrast_percent > .77 &&
              editionStatus.avg_ligtness > 220 &&
              editionStatus.max_lightness >= 204
            ) {
              ctx.filter = "invert(0.9) hue-rotate(180deg)";
              ctx.drawImage(img, 0, 0);
              editionStatus.edited = true;
              return true;
            } else if (editionStatus.colorCounter.size > 1) {

              if (editionStatus.alpha_percent > 0.1 && !(editionStatus.alpha_qty * 2 > theImageDataUint32TMP.length)) {
                return false; // Not a background : Too much pure alpha pixels
              }
              let min_bright_trigger = 255 * 0.4;
              if (editionStatus.avg_ligtness < min_bright_trigger && editionStatus.max_lightness < min_bright_trigger) {
                editionStatus.probable_dark_background_having_contrast = true;
                return false; // If its a background, i'ts already a dark one, and it has no contrast elements, no need to darken it more
              }
              if (editionStatus.contrast_percent > .45 && editionStatus.avg_ligtness > 127 || editionStatus.contrast_percent > .60) {
                return false; // This image is bright but seems to have contrast elements, if we darken it we will loose these elements
              }

            }

          }

        }
        console.log("Background", details.url,details.requestId, "Background edited in", new Date() / 1 - start_date / 1);
        imageData.data.set(theImageDataClamped8TMP);

        ctx.putImageData(imageData, 0, 0);
        
        console.log("Background", details.url,details.requestId, "Put back in context", new Date() / 1 - start_date / 1);
        editionStatus.edited = true;
      },
      edit_an_image: async function(details) {
        
        details.requestId=details.url.split('').map(v=>v.charCodeAt(0)).reduce((a,v)=>a+((a<<7)+(a<<3))^v).toString(16);
        let editionStatus = {
          edited: false,
          statsComplete: false,
          editionConfidenceLogo:0,
          editionConfidenceBackground:0,
        };
        // Determine some basic required things about the image

        let imageURLObject = new URL(details.url);
        
        // Determine the transformation function to use
        let complementIndex = imageURLObject.hash.indexOf("_uDark")
        let complement=new URLSearchParams(complementIndex==-1?"":imageURLObject.hash.slice(complementIndex+6))
        let edition_order_hooks = [uDark.background_image_edit_hook,
          uDark.logo_image_edit_hook
        ];

        if(uDark.background_match.test(imageURLObject.search+ complement.get("class")+complement.get("uDark_cssClass")))
        {
          editionStatus.editionConfidenceBackground=100;
          edition_order_hooks = [uDark.background_image_edit_hook];
        }
        if (
          complement.has("inside_clickable")
          || uDark.logo_match.test(imageURLObject.search+ complement.get("class")+complement.get("uDark_cssClass"))
        ) {
          
          edition_order_hooks = [uDark.logo_image_edit_hook];
        }

        if (!edition_order_hooks.length) {
          return {}
        }
        
        console.log("Image", "Editing image",details.fromCache, details.url,details.requestId,details.isDataUrl);

        // Do the common tasks required for all edited images
        let start_date = new Date();

          console.log("Image", "Filter has stopped", new Date() / 1 - start_date / 1,details.url,details.requestId);
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
          console.log("Image","Blob created", new Date() / 1 - start_date ,details.url,details.requestId)
          let imageBitmap;
          try
          {
            
            imageBitmap=await  createImageBitmap(blob);
          }
          catch(e)
          {
            console.log("Image","Invalid or disposed image", new Date() / 1 - start_date ,details.url,details.requestId)
            // Invalid or disposed image.
            return editionStatus;

          }
          if(uDark.experimentalAttemptImageStat)
          {
            
            editionStatus.is_photo = await uDark.is_photo_stat(editionStatus, imageBitmap,details);
          }
            if(editionStatus.is_photo){editionStatus.editionConfidenceBackground=-1000}
          // blob.arrayBuffer().then((buffer) => {
            {

              console.log("Image","created ImageBitmap", new Date() / 1 - start_date ,details.url,details.requestId)
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

                const canvas = new OffscreenCanvas(imageBitmap.width, imageBitmap.height);
                const ctx = canvas.getContext('2d');
                for (let imageEditionHook of edition_order_hooks) {
                  if (editionStatus.edited === false) {
                    
                    console.log("Image edition hook",imageEditionHook, new Date() / 1 - start_date ,details.url,details.requestId)
                    imageEditionHook(editionStatus, canvas, ctx, imageBitmap, blob, details, imageURLObject, complement);
                    console.log("Image acceptance",editionStatus.edited,editionStatus.rejected, new Date() / 1 - start_date ,details.url,details.requestId)
                  }
                }
                if (editionStatus.edited === true) {


                  // Write the edited image to the filter and disconnect it
                  console.log("Image", "Going blob", new Date() / 1 - start_date / 1,details.url,details.requestId);
                  let editedBlobWithImageHeaders= await canvas.convertToBlob();
                  let buffer= await editedBlobWithImageHeaders.arrayBuffer();
                    
                      console.log("Image", "Canvas to blob done", new Date() / 1 - start_date / 1,details.url,details.requestId);
                      console.log("Image", "Blob to arraybuffer", new Date() / 1 - start_date / 1,details.url,details.requestId);
                   
                      editionStatus.editedBuffer = buffer;
                      console.log("Image", "Image written in filter having edited it", new Date() / 1 - start_date / 1,details.url,details.requestId);
                    }
                    
                    return editionStatus;

                // filter.write(theImageDataUint32TMP.buffer);
                // filter.write(details.buffers[0]);
                // filter.disconnect();
              };

        }

      }



onmessage = async (e) => {
    if(e.data.oneImageBuffer)
    {
     imageBuffers.push(e.data.oneImageBuffer);
    }
    if(e.data.filterStopped)
    {   

        let editionResult = {};
        
        editionResult = await uDark.edit_an_image(e.data.details);
        if(editionResult.editedBuffer)
        {
            imageBuffers=[editionResult.editedBuffer];
        }
        
        console.log("Sending back",imageBuffers,editionResult.editedBuffer);
        postMessage({editionComplete:1,buffers:imageBuffers},imageBuffers);
        
        console.log("filter stopped");
        imageBuffers=[];
    }
  };
  