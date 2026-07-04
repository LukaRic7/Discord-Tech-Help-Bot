const { PermissionsBitField, ChannelType } = require('discord.js');

// Category to put the temp voice channels under
const PARENT_CATEGORY_ID = '1523051919239811144';
// Channel users join to create their temp voice channel
const LISTENER_CHANNEL_ID = '1523052537282822184';

// In-memory channel references for the temp channels
const tempChannelCache = [];

/**
 * Creates a temporary voice channel for the user and moves them into it.
 *
 * @param {VoiceState} newState - The updated voice state.
 */
async function createTempVoiceChannel(newState) {
    try {
        const member = newState.member;
        const user = member.user;
        
        // Create a new voice channel inside the specified category
        const newChannel = await newState.guild.channels.create({
            name: `➡️${user.globalName || user.username}`,
            type: ChannelType.GuildVoice,
            parent: PARENT_CATEGORY_ID
        });
        
        // Store channel in cache for later cleanup
        tempChannelCache.push(newChannel);
        
        // Move the user into the newly created channel
        await member.voice.setChannel(newChannel);
    } catch (err) {
        console.error('Error creating temp voice channel:', err);
    }
}
/**
 * Deletes temporary voice channels that are empty and were previously created.
 *
 * @param {VoiceState} oldState - The previous voice state.
 */
async function closeEmptyChannels(oldState) {
    try {
        tempChannelCache.forEach(async (channel, index) => {
            // Make sure the channel matches the one the user left
            if (oldState.channelId !== channel.id) return;
            // Make sure theres no users in the channel
            if (channel.members.size > 0) return;

            // Delete the channel in Discord and remove it from the cache
            await channel.delete();
            tempChannelCache.splice(index, 1);
        });
    } catch (err) {
        console.error('Error deleting temp voice channel:', err);
    }
}

module.exports = {
    /**
    * Main handler for voice state updates.
    *
    * @param {VoiceState} oldState - Previous voice state.
    * @param {VoiceState} newState - New voice state.
    */
    async onStateUpdated(oldState, newState) {
        // If user joins the listener channel, create a temp voice channel
        if (newState.channelId == LISTENER_CHANNEL_ID) {
            createTempVoiceChannel(newState);
        }
        
        // Attempt cleanup of empty channels when user leaves
        closeEmptyChannels(oldState);
    }
};