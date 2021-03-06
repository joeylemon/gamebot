const fs = require("fs")
const request = require("request")
const constants = require("./constants.js")
const config = require("./config.js")


let cachedChampions

/**
 * Get the current users in a voice channel
 * @return {Array} The list of users
 */
exports.getChatUsers = () => {
    const channel = constants.client.guilds.cache.array()
        .map(guild => guild.channels.cache.array()).flat()
        .find(channel => channel.type === "voice" && channel.members.array().length > 0)

    if (channel)
        return channel.members.array().filter(m => !m.user.bot).map(m => m.user)

    return new Array()
}

/**
 * Get the current voice connection of the bot
 * @return {VoiceConnection} The voice connection
 */
exports.getVoiceConnection = () => {
    if (constants.client.voice.connections.array().length === 0)
        return undefined

    return constants.client.voice.connections.array()[0]
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
 * An unexported helper function to get a playlist's tracks page-by-page
 * @param {string} playlist_id The id of the playlist to get tracks from
 * @param {string} access_token The Spotify API access token, generated with refreshSpotifyToken()
 * @param {string} next The url to the next page of tracks. If empty, get the first page
 */
function getPlaylistTracks(playlist_id, access_token, next) {
    return new Promise((resolve, reject) => {
        request({
            url: next ? next : `https://api.spotify.com/v1/playlists/${playlist_id}/tracks`,
            headers: {
                "Authorization": `Bearer ${access_token}`
            }
        }, (error, response, body) => {
            if (error && error !== null)
                reject(error)

            if (response.statusCode && response.statusCode !== 200)
                reject(`Status code ${response.statusCode}`)

            resolve(JSON.parse(body))
        })
    })
}

/**
 * An unexported helper function to get a playlist's information
 * @param {string} playlist_id The id of the playlist to get information of
 * @param {string} access_token The Spotify API access token, generated with refreshSpotifyToken()
 */
function getPlaylistInformation(playlist_id, access_token) {
    return new Promise((resolve, reject) => {
        request({
            url: `https://api.spotify.com/v1/playlists/${playlist_id}`,
            headers: {
                "Authorization": `Bearer ${access_token}`
            }
        }, (error, response, body) => {
            if (error && error !== null)
                reject(error)

            if (response.statusCode && response.statusCode !== 200)
                reject(`Status code ${response.statusCode}`)

            resolve(JSON.parse(body))
        })
    })
}

/**
 * Get the application's next access token
 * 
 * Every access token expires in 60 minutes, however, you can simply refresh the token
 * before every API call to simplify things (which is what we do)
 */
exports.refreshSpotifyToken = () => {
    return new Promise((resolve, reject) => {
        request.post({
            url: "https://accounts.spotify.com/api/token",
            form: {
                "grant_type": "refresh_token",
                "client_id": constants.SPOTIFY_CLIENT_ID,
                "client_secret": constants.SPOTIFY_CLIENT_SECRET,
                "refresh_token": constants.SPOTIFY_REFRESH_TOKEN
            }
        }, (error, response, body) => {
            if (error && error !== null)
                reject(error)

            if (response.statusCode && response.statusCode !== 200)
                reject(`Status code ${response.statusCode}`)

            resolve(JSON.parse(body).access_token)
        })
    })
}

/**
 * Get a spotify playlist
 * @param {string} playlist_id The id of the playlist
 */
exports.getSpotifyPlaylist = (playlist_id) => {
    return new Promise((resolve, reject) => {
        this.refreshSpotifyToken()
            .then(async access_token => {
                console.log("fetching spotify playlist using access_token", access_token)

                const info = await getPlaylistInformation(playlist_id, access_token)

                let playlist = []
                let next = undefined
                do {
                    const tracks = await getPlaylistTracks(playlist_id, access_token, next)
                    playlist = playlist.concat(tracks.items)
                    next = tracks.next
                } while (next)

                resolve([info, playlist])
            })
            .catch(err => reject(err))
    })
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
 * Format seconds into a MM:SS string
 * @param {number} s The seconds
 * @return {string} The formatted string
 * @usage
 *   formatSeconds(65);         // -> '1m 5s'
 */
exports.formatSeconds = (s) => {
    if (s < 0) return "0s"

    const minutes = Math.floor(s / 60)
    const seconds = s % 60

    if (minutes === 0)
        return `${seconds}s`

    return `${minutes}m ${seconds}s`
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