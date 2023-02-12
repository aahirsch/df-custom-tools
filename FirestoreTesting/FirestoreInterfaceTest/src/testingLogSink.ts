const {Logging} = require('@google-cloud/logging');

// Creates a client

let projId: String = 'heartschat-prod-a505';
const logging = new Logging({ projectId: projId });  

/**
 * TODO(developer): Uncomment the following line to run the code.
 */
const sinkName = 'negbot-conv-logs-pubsub';

const sink = logging.sink(sinkName);

async function printSinkMetadata() {
  // See https://googleapis.dev/nodejs/logging/latest/Sink.html#getMetadata
  const [metadata] = await sink.getMetadata();
  console.log(`Name: ${metadata.name}`);
  console.log(`Destination: ${metadata.destination}`);
  console.log(`Filter: ${metadata.filter}`);
}
printSinkMetadata();