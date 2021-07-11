const { CommunicationIdentityClient } = require("@azure/communication-identity");
const { CommunicationRelayClient } = require("@azure/communication-network-traversal");

const relayToken = async () => {

    const connectionString = process.env['COMMUNICATION_SERVICES_CONNECTION_STRING'];

    const identityClient = new CommunicationIdentityClient(connectionString);

    let identityResponse = await identityClient.createUser();

    const relayClient = new CommunicationRelayClient(connectionString);

    const config = await relayClient.getRelayConfiguration(identityResponse);

    console.log(config);

    return {
        userId: identityResponse.communicationUserId,
        turnServerConfig: config.turnServers[0]
    }
};

relayToken().catch((error) => {
  console.log("Encountered and error");
  console.log(error);
})

module.exports = relayToken;