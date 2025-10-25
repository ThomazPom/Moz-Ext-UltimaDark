const fs = require('fs');
const path = require('path');

// Dictionnaire des bundles à builder
const bundles = {
  pooledAI: [
    'messageLogicPooled.js', // Messaging logic
    'imageWorkerHeuristic.js', // In the end it contains heuristic and editing logic
    'imageWorkerAIEdit.js', // AI image editing logic, replaces editing logic in heuristic
    'tfjs-core.js', // TensorFlow.js core
    'tf-layers.min.js', // TensorFlow.js Layers API
    'tfjs-backend-cpu.js', // TensorFlow.js CPU backend
    'imageWorkerAI.js', // AI utilities
  ],
  pooledHeuristic: [
    'imageWorkerHeuristic.js', // Heuristic image processing logic
    'messageLogicPooled.js', // Messaging logic
  ],
  native: [
    'messageLogicNative.js', // Messaging logic
    'imageWorkerHeuristic.js', // Heuristic image processing logic
  ],
  nativeOldSlow: [
    'messageLogicNative.js', // Messaging logic
    'imageWorker2.js', // Old slower heuristic image processing logic
  ],

  pooledBench: [
    'messageLogicPooled.js', // Messaging logic
    'imageWorkerAIBench.js', // AI benchmarking logic
    'tfjs-core.js', // TensorFlow.js core
    'tf-layers.min.js', // TensorFlow.js Layers API
    'tfjs-backend-cpu.js', // TensorFlow.js CPU backend
    'imageWorkerAI.js', // AI utilities
  ]
};

function wrapWithTimer(filename, code) {
  const timerName = `load:${filename}`;
  return `// --- BEGIN ${filename} ---\nconsole.time('${timerName}');\n${code}\nconsole.timeEnd('${timerName}');\n// --- END ${filename} ---\n`;
}

function concatBundle(bundleName, files) {
  const outFile = `imageWorkerBundle-${bundleName}.js`;
  const out = fs.createWriteStream(outFile);
  files.forEach(f => {
    const filePath = path.join(__dirname, f);
    if (fs.existsSync(filePath)) {
      const code = fs.readFileSync(filePath, 'utf8');
      out.write(wrapWithTimer(f, code));
      out.write('\n');
    } else {
      out.write(`// --- MISSING ${f} ---\n`);
    }
  });
  out.end();
  console.log(`Fichiers concaténés dans ${outFile}`);
}

function buildAllBundles() {
  for (const [name, files] of Object.entries(bundles)) {
    concatBundle(name, files);
  }
}

buildAllBundles();

if (process.argv.includes('--watch')) {
  console.log('Mode watch activé. Surveillance des fichiers...');
  for (const [name, files] of Object.entries(bundles)) {
    files.forEach(f => {
      const filePath = path.join(__dirname, f);
      fs.watchFile(filePath, { interval: 500 }, () => {
        console.log(`${f} modifié, reconcaténation du bundle ${name}...`);
        concatBundle(name, files);
      });
    });
  }
}
