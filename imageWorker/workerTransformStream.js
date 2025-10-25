self.onmessage = (e) => {
  const {  buf } = e.data || {};
  // Retourne le buffer modifié (transféré) + checksum
  self.postMessage({  editionComplete: true, buf }, [buf]);
};