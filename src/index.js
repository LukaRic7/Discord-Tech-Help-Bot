const { Client, GatewayIntentBits, EmbedBuilder, Embed } = require('discord.js');

if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config({ path: '../.env' });
}
const scamdetector = require('./spamdetector.js');
const dynamicvoice = require('./dynamicvoice.js');

// Create a client instance
const client = new Client({
    intents: [
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates
    ]
});

// Listen for when the client is ready
client.once('clientReady', () => {
    console.log(`Logged in as: "${client.user.tag}"`);
});

// Called when a message (or attachment) is created in any channel
client.on('messageCreate', async (message) => {
    // Make sure its a user and not a bot
    if (message.author.bot) return;

    scamdetector.register(message);
});

// Listen for when a user joins or leaves a voice channel
client.on('voiceStateUpdate', async (oldState, newState) => {
    // Make sure its a user and not a bot
    if (oldState.member?.user?.bot) return;
    if (newState.member?.user?.bot) return;

    dynamicvoice.onStateUpdated(oldState, newState);
});

client.login(process.env.TOKEN);