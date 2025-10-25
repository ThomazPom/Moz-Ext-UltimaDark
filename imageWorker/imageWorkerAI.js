
console.log("ImageWorkerAI.js started");



WorkerGlobalScope.model = null;
let SIZE = 64;
let CLASSES = [];

async function loadLayerModelAndWeightsFromBuffers(modelBuffer, weightsBuffer) {
  if(WorkerGlobalScope.model) return WorkerGlobalScope.model;
  let perf_model_start = performance.now();
  console.log(modelBuffer,new TextDecoder().decode(modelBuffer).slice(0,100));
  // convert buffer to browserfile:
  
  const modelBlob = new Blob([modelBuffer], { type: 'application/json' });
  const modelFile = new File([modelBlob], 'model.json');
  
  const weightsBlob = new Blob([weightsBuffer], { type: 'application/octet-stream' });
  const weightsFile = new File([weightsBlob], 'imageClassifierModel.weights.bin');
  await tf.setBackend('cpu').then(() => console.log("Backend set to cpu"));
  WorkerGlobalScope.model=  tf.loadLayersModel(tf.io.browserFiles([modelFile, weightsFile]));
  console.log(`Model loaded from buffers in ${performance.now() - perf_model_start} ms`);
  
  return WorkerGlobalScope.model;
}

async function loadGraphModelFromBuffers(modelBuffer, weightsBuffer) {
  if(WorkerGlobalScope.model) return WorkerGlobalScope.model;
  let perf_model_start = performance.now();
  console.log(modelBuffer,new TextDecoder().decode(modelBuffer).slice(0,100));
  // convert buffer to browserfile:
  const modelBlob = new Blob([modelBuffer], { type: 'application/json' });
  const modelFile = new File([modelBlob], 'model.json');
  
  const weightsBlob = new Blob([weightsBuffer], { type: 'application/octet-stream' });
  const weightsFile = new File([weightsBlob], 'group1-shard1of1.bin');
  
  WorkerGlobalScope.model = await tf.loadGraphModel(tf.io.browserFiles([modelFile, weightsFile]));
  console.log(`Model loaded from buffers in ${performance.now() - perf_model_start} ms`,modelBuffer);
  
  return WorkerGlobalScope.model;
}

// Convert ImageBitmap to tensor
function bitmapToTensor(bitmap) {
  let perf_tensor_start = performance.now();
  let perf_frame_start = performance.now();
  // const tensor = tf.browser.fromPixels(bitmap, 3).div(255.0).expandDims(0); // Original but cant use it with import optimization
  const tensor = tf.expandDims(tf.div(tf.browser.fromPixels(bitmap, 3), 255.0), 0); // Use it with import optimization
  
  console.log(`Tensor created in ${performance.now() - perf_tensor_start} ms`, "fromPixels", performance.now() - perf_frame_start);
  return tensor;
}
function bitmapToTensor_tfmin(bitmap) {
  let perf_tensor_start = performance.now();
  let perf_frame_start = performance.now();
  const tensor = tf.browser.fromPixels(bitmap, 3).div(255.0).expandDims(0); // Original but cant use it with import optimization
  // const tensor = tf.expandDims(tf.div(tf.browser.fromPixels(bitmap, 3), 255.0), 0); // Use it with import optimization
  
  console.log(`Tensor created in ${performance.now() - perf_tensor_start} ms`, "fromPixels", performance.now() - perf_frame_start);
  return tensor;
}


function loadBufferModelAsap(){
  console.log("Loading model asap",WorkerGlobalScope.modelBuffer,WorkerGlobalScope.weightsBuffer);
  loadLayerModelAndWeightsFromBuffers(WorkerGlobalScope.modelBuffer, WorkerGlobalScope.weightsBuffer).then(
    () => console.log("Model loaded in worker")
  );
}

// loadBufferModelAsap();

console.log("ImageWorkerAI.js finished loading");

