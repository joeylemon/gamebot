const utils = require('../utils.js');
const constants = require('../constants.js');
const fs = require('fs');

// Track playtime by adding time every 5 seconds
let lastCheck = Date.now();
setInterval(() => {
    let playtime = getPlaytime();
    utils.getChatUsers().map(user => trackPlaytime(playtime, user, Date.now() - lastCheck));
    lastCheck = Date.now();
    savePlaytime(playtime);
}, 5000);

constants.client.on('voiceStateUpdate', (oldMember, newMember) => {
    // User joins channel
    if (oldMember.voiceChannel === undefined && newMember.voiceChannel !== undefined) {
        startSession(newMember.id);

    // User leaves channel
    } else if (newMember.voiceChannel === undefined) {
        //startSession(newMember.id);
    }
});

/**
 * Read the playtime file and parse it into a dictionary
 */
function getPlaytime() {
    const data = fs.readFileSync('/home/dustin/discord/playtime.json');
    return JSON.parse(data);
}

/**
 * Update the playtime file with the new data
 * @param {Object} playtime The updated playtime object
 */
function savePlaytime(playtime) {
    fs.writeFileSync('/home/dustin/discord/playtime.json', JSON.stringify(playtime));
}

/**
 * Start a gaming session for the given user
 * @param {number} userID The discord ID of the user to start a session for
 */
function startSession(userID) {
    let playtime = getPlaytime();
    
    // Initialize a new user
    if (!playtime[userID])
        playtime[userID] = {"Total time in Discord": 0};

    playtime[userID]["Current session"] = 0;
    savePlaytime(playtime);
}

/**
 * Add playtime to a specific activity
 * @param {Object} playtime The playtime JSON blob
 * @param {number} userID The discord ID of the user to add time to
 * @param {string} activity The activity to add time to
 * @param {number} amount The amount of time to add
 */
function addPlaytime(playtime, userID, activity, amount) {
    // Initialize a new user
    if (!playtime[userID])
        playtime[userID] = {"Total time in Discord": 0};

    // Initialize a new activity
    if (!playtime[userID][activity])
        playtime[userID][activity] = 0;

    playtime[userID][activity] += amount;
}

/**
 * Track the playtime for the user's total time, session time, and all games
 * @param {Object} playtime The playtime JSON blob
 * @param {User} user The user to add time to
 * @param {number} amount The amount of time to add
 */
function trackPlaytime(playtime, user, amount) {
    // Keep track of total time in Discord
    addPlaytime(playtime, user.id, "Total time in Discord", amount);

    // Keep track of current session time in Discord
    addPlaytime(playtime, user.id, "Current session", amount);

    // Keep track of each game's playtime
    if (!user.presence.activities)
        return

    user.presence.activities.map(activity => addPlaytime(playtime, user.id, activity.name, amount));
}

module.exports = (msg) => {
    const playtime = getPlaytime();
    const args = msg.content.split(" ");

    let user = { id: msg.author.id, name: msg.author.username };

    // If the user gave a @User mention, find the id given
    if (args.length > 1) {
        const id = utils.getMentionID(args[1]);
        if (id) {
            user = { id: id, name: utils.capitalize(utils.getRandomInsult()) };
        } else {
            msg.reply(`I couldn't find that user, ${utils.getRandomInsult()}. You gotta use it like \`!stats @Lemons\``);
            return;
        }
    }

    // Make sure the user has playtime statistics
    if (!playtime[user.id]) {
        msg.reply(`There aren't any stats to show, ${utils.getRandomInsult()}`);
        return;
    }

    const time = playtime[user.id];
    const fields = Object.keys(time).map(game => {
        return { "name": game, "value": utils.formatMilliseconds(time[game]) }
    });

    msg.reply({
        embed: {
            color: 0xFFA500,
            title: `${user.name}'s Statistics`,
            thumbnail: {
                url: 'https://i.imgur.com/fnm2zrw.png',
            },
            fields: fields
        }
    });
};