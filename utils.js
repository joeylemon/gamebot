const fs = require("fs")
const constants = require("./constants.js")
const config = require("./config.js")


let cachedChampions

/**
 * Get the current users in a voice channel
 * @return {Array} The list of users
 */
exports.getChatUsers = () => {
    for (const channel of constants.client.channels.array()) {
        if (channel.type === "voice" && channel.members.array().length > 0) {
            return channel.members.array().map(m => m.user)
        }
    }
    return new Array()
}

/**
 * Get the ID from an @User argument
 * @param {string} arg The argument with the @User string
 * @return {string} The ID of the @User
 * @usage
 *   getMentionID("<@279396504320344064>")      // -> 279396504320344064
 */
exports.getMentionID = (arg) => {
    if (arg.startsWith('<@') && arg.endsWith('>')) {
        let id = arg.slice(2, -1)
        if (id.startsWith('!')) id = id.slice(1)
        return id
    }
}

/**
 * Get a League champion's data by their id
 * https://developer.riotgames.com/docs/lol#data-dragon_champions
 * @param {number} id The id of the champion
 * @return {Object} The champion's data, including name, title, description, etc
 */
exports.getChampion = (id) => {
    if (!cachedChampions)
        cachedChampions = JSON.parse(fs.readFileSync("etc/champions.json")).data

    const name = Object.keys(cachedChampions).find(name => cachedChampions[name].key === id.toString())
    return cachedChampions[name]
}

/**
 * Shuffles an array randomly
 * @param {Array} arr The array to shuffle
 * @return {Array}
 * @usage
 *   shuffle([1, 2, 3]);   // -> [2, 3, 1]
 */
exports.shuffle = (arr) => {
    arr = [...arr] // Copy the array to a new object
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]]
    }
    return arr
}

/**
 * Capitalizes first letters of words in string.
 * @param {string} str String to be modified
 * @param {boolean=false} lower Whether all other letters should be lowercased
 * @return {string}
 * @usage
 *   capitalize('fix this string');     // -> 'Fix This String'
 *   capitalize('javaSCrIPT');          // -> 'JavaSCrIPT'
 *   capitalize('javaSCrIPT', true);    // -> 'Javascript'
 */
exports.capitalize = (str, lower = false) => {
    return (lower ? str.toLowerCase() : str).replace(/(?:^|\s|["'([{])+\S/g, match => match.toUpperCase())
}

/**
 * Format milliseconds into a D:H:M string
 * @param {number} ms The milliseconds
 * @return {string} The formatted string
 * @usage
 *   formatMilliseconds(36065000);         // -> '1h 1m'
 */
exports.formatMilliseconds = (ms) => {
    const minutes = Math.floor((ms / (1000 * 60)) % 60),
        hours = Math.floor((ms / (1000 * 60 * 60)) % 24)
    days = Math.floor((ms / (1000 * 60 * 60 * 24)))

    const d = days > 0 ? `${days} days ` : ``
    const h = hours > 0 ? `${hours} hours ` : ``

    return `${d}${h}${minutes} minutes`
}

/**
 * Get a random element from the given array
 * @param {Array} arr The array
 * @return {Object} A random element of the array
 * @usage
 *   getRandomElement([1,2,3]);            // -> 1
 *   getRandomElement([1,2,3]);            // -> 3
 */
exports.getRandomElement = (arr) => {
    return arr[Math.floor(Math.random() * arr.length)]
}

/**
 * Get a random insult from the insults array
 * @return {string} The insult
 * @usage
 *   getRandomInsult();
 */
exports.getRandomInsult = () => {
    return this.getRandomElement(this.getInsults())
}

/**
 * Get the map of discord ids to individual information
 * @return {Object} Map of discord ids to individual information
 */
exports.getDiscordMap = () => {
    return config.get("discord_ids")
}

/**
 * Get the array of possible games to play
 * @return {Array} Array of possible games to play
 */
exports.getGames = () => {
    return config.get("games")
}

/**
 * Get the array of CS:GO maps to play
 * @return {Array} Array of CS:GO maps to play
 */
exports.getMaps = () => {
    return config.get("maps")
}

/**
 * Get the array of insults to call users
 * @return {Array} Array of insults to call users
 */
exports.getInsults = () => {
    return config.get("insults")
}