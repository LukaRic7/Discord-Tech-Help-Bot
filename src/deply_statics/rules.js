const { Client, GatewayIntentBits, EmbedBuilder, Embed } = require('discord.js');
require('dotenv').config({ path: '../../.env' });

// Type "setup-rules" to post message

const rule_segments = [`
## §1 🧑‍🤝‍🧑 Be Respectful
Treat all members in a respectful way. We are here to help each other and learn.
- No harrasment.
- No hate speech.
- No discrimination.
- No personal attacks.
-# Debate is fine, disrespect is not.
## §2 📢 No Spam
Spamming across channels is not allowed, keep the server clean.
- No unsolicited links.
- No server invites.
-# Promoting own work is allowed in: <#1398040804035133592>
## §3 🔞 Keep It Safe For Work
This server is fully SFW, and is meant to be a safe learning space.
- No porn.
- No gore.
-# Cursing to a certain extent is allowed.
## §4 💻 Open Source Only
All shared projects, scripts and tools must be open source.
- No code obfuscation.
- No closed-source uploads.
- No binaries without source.
-# Transparency keeps the community safe and collaborative.
## §5 🤖 No AI Dump
It's perfectly alright using tools like ChatGPT for programming and information, but review the code/info before posting.
- Credit source if relevant.
- Validate information before posting.
-# Dumping AI-output without ensuring it's safe, may get the message deleted.
## §6 ⚠️ No Doxxing, Hacking, or Piracy
This is a safe and legal community. We do not allow:
- Sharing addresses, IPs or other private info.
- No cracking tools or exploits.
- No links or uploads of pirated/cracked software.
-# Help keep the community safe and report any doxxing attacks.
## §7 📌 Stay on Topic
- Post in the correct channels.
-# Too many misplaced messages may be removed.
## §8 📰 Advertisement
Self-advertisement is allowed under the circumstances listed below:
- You cannot require payment in any form.
- You may offer payment to others in any form.
- Be clear, no gray areas or shady services.
-# All self-advertisement must be posted in: <#1423382037015826493>
`];

// Create a client instance
const client = new Client({
    intents: [
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.Guilds
    ]
});

// Listen for when the client is ready
client.once('clientReady', () => {
    console.log(`Logged in as: "${client.user.tag}"`);
});

// Called when a message (or attachment) is created in any channel
client.on('messageCreate', async (message) => {
    // Make sure the user typed "setup-rules"
    if (message.content != 'setup-rules') return;

    // Build the embed
    const embed = new EmbedBuilder()
        .setDescription(rule_segments.join(''))
        .setColor(0xFF0000);

    // Post a message containing the embed
    await message.channel.send({ embeds: [embed] });
});

client.login(process.env.TOKEN);