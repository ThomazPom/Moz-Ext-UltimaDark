



if(!activeMessageLogging)
    {
    console.log =()=>undefined
}

console.log("Image Service worker started")


class uDarkBench {
    
    static async predictAndWriteOnImage(details,e){
        
        details.requestId=details.url.split('').map(v=>v.charCodeAt(0)).reduce((a,v)=>a+((a<<7)+(a<<3))^v).toString(16);
        let editionStatus = {
            edited: true    ,
        };
        
        let perf_start = performance.now();
        
        
        console.log("Image","Blob created", performance.now() - perf_start, details.url, details.requestId)
        let imageBitmap;
        
        let blob = (new Blob(imageBuffers));
        try
        {
            
            imageBitmap=await  createImageBitmap(blob);
            
            
            
        }
        catch(e)
        {
            console.log("Image","Invalid or disposed image",e, performance.now() - perf_start, details.url, details.requestId)
            // Invalid or disposed image.
            return editionStatus;
            
        }
        const canvas = new OffscreenCanvas(imageBitmap.width, imageBitmap.height);
        const ctx = canvas.getContext('2d',/* {willReadFrequently:true} is a exiting option, but needs benchmarking */); 
        ctx.drawImage(imageBitmap, 0, 0);
        imageBitmap.close();


        let benchDirectAIPrediction=true    ;
        if(benchDirectAIPrediction){
            
            let imageBitmap = await createImageBitmap(blob,{
                resizeHeight:64,
                resizeWidth:64
            });
            const tensor = bitmapToTensor(imageBitmap);
            imageBitmap.close();
            let model = await loadLayerModelAndWeightsFromBuffers(WorkerGlobalScope.modelBuffer, WorkerGlobalScope.weightsBuffer);
        
            console.log("Predicting image type for requestId",details.requestId,model);
            let perf_pred_start = performance.now();
            
            const pred = model.predict(tensor);
            let prediction_perf = performance.now() - perf_pred_start;
            console.log(`Prediction made in ${prediction_perf} ms`);
            // var idx=pred.argMax(1).dataSync()[0]; // Cant use it with import optimization
            // var probs = pred.dataSync();
            
            var idx=tf.argMax(pred,1).dataSync()[0]; // Use it with import optimization
            
            
            var responsePerf = performance.now() - perf_start;
            console.log(`Response ready in ${responsePerf} ms`,"responseLoss:",responsePerf - prediction_perf);
            let CLASSES =  ["logo", "icon", "background", "photo", "abstract"];
            var iaResponse = {
                type: 'result',
                index: idx,
                class: CLASSES[idx],
                // probabilities: Array.from(probs),
                prediction_perf
            };
            // console.log("Image", "AI direct prediction", CLASSES[idx], Math.round(probs[idx]*100)+"%", prediction_perf, details.url, details.requestId);
            console.log("%c" + CLASSES[idx] +" AI direct prediction", "color: orange",iaResponse);
            
        }
        
        if(benchDirectAIPrediction){
            
            
            ctx.font = "24px serif";
            ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.fillStyle = "orange";
            let i =0;
            [
                iaResponse.class,//+" "+Math.round(iaResponse.probabilities[idx]*100)+"%",
                "prediction:"+iaResponse.prediction_perf+"ms",
                "response:"+responsePerf+"ms.",
                "messaging loss : "+(responsePerf - iaResponse.prediction_perf)+"ms"
            ].forEach(text => ctx.fillText(text, 7, 20 + 24 * i++));
            editionStatus.edited = true;
            
        }
        if (editionStatus.edited === true) {
            
            
            // Write the edited image to the filter and disconnect it
            console.log("Image", "Going blob", performance.now() - perf_start, details.url, details.requestId);
            let editedBlobWithImageHeaders= await canvas.convertToBlob();
            let buffer= await editedBlobWithImageHeaders.arrayBuffer();
            
            console.log("Image", "Canvas to blob done", performance.now() - perf_start, details.url, details.requestId);
            console.log("Image", "Blob to arraybuffer", performance.now() - perf_start, details.url, details.requestId);
            
            editionStatus.editedBuffer = buffer;
            console.log("Image", "Image written in filter having edited it", performance.now() - perf_start, details.url, details.requestId);
        }
        
        
        return editionStatus;
    }
    
}


uDark = {
    edit_an_image: uDarkBench.predictAndWriteOnImage
};
