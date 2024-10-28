onmessage = async function (event) {
    console.log('Received message from the main thread:', event.data);
  
    await this.setTimeout(20000);
    // Send the result back to the main thread
    postMessage(event.data + "A");
  };