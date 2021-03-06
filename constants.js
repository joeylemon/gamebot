const config = require("./config.js")

// Environment variables exist in the makefile
exports.DISCORD_TOKEN = process.env.DISCORD_TOKEN
exports.RIOT_API_TOKEN = process.env.RIOT_API_TOKEN
exports.GENIUS_API_TOKEN = process.env.GENIUS_API_TOKEN
exports.SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID
exports.SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET
exports.SPOTIFY_REFRESH_TOKEN = process.env.SPOTIFY_REFRESH_TOKEN

// Log in the bot
const Discord = require('discord.js')
exports.client = new Discord.Client()
this.client.login(this.DISCORD_TOKEN)

exports.LYRICS_LENGTH = 600 // How many characters to display for a song's lyrics (max: 1024)