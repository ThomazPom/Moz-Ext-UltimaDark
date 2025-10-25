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
