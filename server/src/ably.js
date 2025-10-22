import * as Ably from 'ably';
import dotenv from "dotenv";


//OLD -I think
dotenv.config("../.env");

//Test printout to see if api key is set properly, if it saysi n the console undefined then make sure you have .env in the server file with ABLY_API_KEY=
console.log("ABLY_API_KEY:", process.env.ABLY_API_KEY);



async function getStarted() {
    //Create new ably connectoin with api key and sudo client id, 
    const realtimeClient = new Ably.Realtime({
        key: process.env.ABLY_API_KEY,
        clientId: 'my-first-client'
    });

    //connect method
    await realtimeClient.connection.once('connected');
    console.log(`Made my first connection!`);

    //get the channel
    const channel = realtimeClient.channels.get('my-first-channel');

    //subscribe to the channel, when message is received on the channel, log in the console
    await channel.subscribe((message) => {
        console.log(`Received message: ${message.data}`);
    });
    //publish message to the channel 
    await channel.publish('example', 'A message sent from my first client!');

    //log when each member joins the channel
    await channel.presence.subscribe((member) => {
        console.log(`Event type: ${member.action} from ${member.clientId} with the data ${JSON.stringify(member.data)}`)
    });

    await channel.presence.enter("I'm here!");


    //Retrieve any messages that were recently published to the channel
    const history = await channel.history();
    console.log(history.items.map((message) => message.data));

    //Connections automatically closed after 2 minutes of no activity
    //Or set the connection timeout to 10 seconds
    setTimeout(() => realtimeClient.close(), 10000);
};


getStarted();
