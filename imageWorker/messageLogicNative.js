
let imageBuffers = [];
let activeMessageLogging = false;
if(!activeMessageLogging)
    {
    console.log =()=>undefined
}


onmessage = async (e) => {
    // if(e.data.hasIA) // No ia on native messaging
    //     {
    //     WorkerGlobalScope.modelBuffer = e.data.iaModelJsonBuffer;
    //     WorkerGlobalScope.weightsBuffer = e.data.iaModelWeightsBuffer;
    //     console.log("Model buffers set in worker",WorkerGlobalScope.modelBuffer,WorkerGlobalScope.weightsBuffer);
    //     await tf.setBackend('cpu');
    //     loadBufferModelAsap();
    // }
    if(e.data.reset)
        {
        imageBuffers = [];
    }
    if(e.data.oneImageBuffer)
        {
        imageBuffers.push(e.data.oneImageBuffer);
    }
    if(e.data.filterStopped)
        {   
        
        let editionResult = {};
        
        editionResult = await self.uDark.edit_an_image(e.data.details);
        if(editionResult.editedBuffer)
            {
            imageBuffers=[editionResult.editedBuffer];
        }
        
        console.log("Sending back",imageBuffers,editionResult.editedBuffer);
        postMessage({editionComplete:1,buffers:imageBuffers,
            is_photo: editionResult.is_photo,
            heuristic: editionResult.heuristic
        },imageBuffers);
        
        console.log("filter stopped");
        imageBuffers=[];
    }
};