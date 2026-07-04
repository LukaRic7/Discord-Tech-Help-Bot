const { EmbedBuilder } = require("discord.js");

// Channel to log alerts
const ADMIN_LOG_CHANNEL_ID = '1523044769230753973';

// Channels monitored for spam messages
const WATCH_CHANNEL_IDS = [
    '1398037281851445320',
    '1398071065766527046',
    '1398074003133825145',
    '1398074511232073738',
    '1398047215825457262'
];

// Config
const WINDOW_MS = 60 * 1000;
const THRESHOLD = 3;

// In-memory stores
const recentMessages = new Map();
// userId -> Set(signature)
const flaggedUserSignatures = new Map();

/**
 * Check if a user already has a flagged signature
 */
function isFlagged(userId, signature) {
    return flaggedUserSignatures.get(userId)?.has(signature);
}

/**
 * Build message signature (text + attachments)
 */
function getSignature(message) {
    const text = message.content?.trim() || '';
    const attachments = [...message.attachments.values()]
        .map(a => a.url)
        .sort()
        .join('|');

    return attachments ? `${text}::${attachments}` : text;
}

/**
 * Safe message deletion
 */
async function deleteMessageRef(messageId, channelId, guild) {
    try {
        const channel = await guild.channels.fetch(channelId).catch(() => null);
        if (!channel) return;

        const msg = await channel.messages.fetch(messageId, { force: true }).catch(() => null);
        if (!msg) return;

        await msg.delete().catch(() => {});
    } catch (err) {
        console.error('Failed deleting message:', err);
    }
}

/**
 * Format embed content
 */
function formatDisplayContent(message) {
    const text = message.content?.trim();

    const formattedText = text
        ? `\`\`\`\n${text}\n\`\`\``
        : '*No text content*';

    const attachments = [...message.attachments.values()]
        .map(a => a.url);

    const formattedAttachments = attachments.length
        ? attachments.map(url => `🔗 ${url}`).join('\n')
        : '*No attachments*';

    return `${formattedText}\n\n**Attachments:**\n${formattedAttachments}`;
}

/**
 * MAIN REGISTER FUNCTION
 */
module.exports = {
    async register(message) {
        try {
            if (!WATCH_CHANNEL_IDS.includes(message.channelId)) return;

            const signature = getSignature(message);
            const now = Date.now();
            const user = message.author;

            const userFlags = flaggedUserSignatures.get(user.id);

            if (userFlags?.has(signature)) {
                // Only delete known spam pattern
                await message.delete().catch(() => {});
                return;
            }

            if (!recentMessages.has(signature)) {
                recentMessages.set(signature, []);
            }

            const entries = recentMessages.get(signature);

            entries.push({
                messageId: message.id,
                channelId: message.channelId,
                userId: user.id,
                timestamp: now
            });

            // keep window clean
            const fresh = entries.filter(e => now - e.timestamp <= WINDOW_MS);
            recentMessages.set(signature, fresh);

            const occurrences = fresh.length;

            if (occurrences >= THRESHOLD) {

                // register flagged signature per user
                if (!flaggedUserSignatures.has(user.id)) {
                    flaggedUserSignatures.set(user.id, new Set());
                }

                flaggedUserSignatures.get(user.id).add(signature);

                // delete spam messages
                for (const entry of fresh) {
                    await deleteMessageRef(
                        entry.messageId,
                        entry.channelId,
                        message.guild
                    );
                }

                // build embed
                const suspect = user.globalName
                    ? `"${user.globalName}" aka "${user.username}"`
                    : `"${user.username}"`;

                const embed = new EmbedBuilder()
                    .setTitle('⚠️ Spam Detected')
                    .setDescription(
                        `**Suspect:** ${suspect}\n` +
                        `**User ID:** \`${user.id}\` <@${user.id}>\n\n` +
                        `**Content:**\n${formatDisplayContent(message)}`
                    )
                    .setColor(0xFF0000)
                    .setTimestamp();

                const logChannel = message.guild.channels.cache.get(ADMIN_LOG_CHANNEL_ID);
                if (logChannel) {
                    await logChannel.send({ embeds: [embed] });
                }

                // cleanup memory after window
                setTimeout(() => {
                    recentMessages.delete(signature);
                }, WINDOW_MS);
            }

        } catch (err) {
            console.error('Spam detection error:', err);
        }
    }
};