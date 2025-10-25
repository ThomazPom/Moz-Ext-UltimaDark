



if (!activeMessageLogging) {
    console.log = () => undefined
}

console.log("Image Service worker started")


class uDarkAIEdit {

    static async predictAndEditImage(details, e) {

        let imageURLObject = new URL(details.url);

        // Determine the transformation function to use
        let complementIndex = imageURLObject.hash.indexOf("_uDark")
        let complement = new URLSearchParams(complementIndex == -1 ? "" : imageURLObject.hash.slice(complementIndex + 6))

        details.requestId = details.url.split('').map(v => v.charCodeAt(0)).reduce((a, v) => a + ((a << 7) + (a << 3)) ^ v).toString(16);
        let editionStatus = {
            edited: false,
        };

        let perf_start = performance.now();


        console.log("Image", "Blob created", performance.now() - perf_start, details.url, details.requestId)
        let imageBitmap;

        let blob = (new Blob(imageBuffers));
        try {

            imageBitmap = await createImageBitmap(blob);



        }
        catch (e) {
            console.log("Image", "Invalid or disposed image", e, performance.now() - perf_start, details.url, details.requestId)
            // Invalid or disposed image.
            return editionStatus;

        }
        const canvas = new OffscreenCanvas(imageBitmap.width, imageBitmap.height);
        const ctx = canvas.getContext('2d',/* {willReadFrequently:true} is a exiting option, but needs benchmarking */);
        ctx.drawImage(imageBitmap, 0, 0);


        let imageBitmap4IA = await createImageBitmap(blob, {
            resizeHeight: 64,
            resizeWidth: 64
        });
        const tensor = bitmapToTensor(imageBitmap4IA);
        let model = await loadLayerModelAndWeightsFromBuffers(WorkerGlobalScope.modelBuffer, WorkerGlobalScope.weightsBuffer);

        console.log("Predicting image type for requestId", details.requestId, model);
        let perf_pred_start = performance.now();

        const pred = model.predict(tensor);
        let prediction_perf = performance.now() - perf_pred_start;
        console.log(`Prediction made in ${prediction_perf} ms`);
        // var idx=pred.argMax(1).dataSync()[0]; // Cant use it with import optimization
        // var probs = pred.dataSync();

        var idx = tf.argMax(pred, 1).dataSync()[0]; // Use it with import optimization


        var responsePerf = performance.now() - perf_start;
        console.log(`Response ready in ${responsePerf} ms`, "responseLoss:", responsePerf - prediction_perf);
        let CLASSES = ["logo", "icon", "background", "photo", "abstract"];
        var iaResponse = {
            type: 'result',
            index: idx,
            class: CLASSES[idx],
            // probabilities: Array.from(probs),
            prediction_perf
        };
        // console.log("Image", "AI direct prediction", CLASSES[idx], Math.round(probs[idx]*100)+"%", prediction_perf, details.url, details.requestId);
        console.log("%c" + CLASSES[idx] + " AI direct prediction", "color: orange", iaResponse);
        editionStatus.iaEnabled = true;
        if (["logo", "icon"].includes(iaResponse.class)) {
            console.log("Applying logo/image edit hook", "IA class:", iaResponse.class);
            await uDark.logo_image_edit_hook(editionStatus, canvas, ctx, imageBitmap, blob, details, imageURLObject, complement);

        }
        else if (["background", "abstract"].includes(iaResponse.class)) {
            console.log("Applying logo/image edit hook", "IA class:", iaResponse.class);

            await uDark.background_image_edit_hook(editionStatus, canvas, ctx, imageBitmap, blob, details, imageURLObject, complement);

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
    }

}


uDark.edit_an_image = uDarkAIEdit.predictAndEditImage;
