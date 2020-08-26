const config = require("./config.js")

// Environment variables exist in the makefile
exports.DISCORD_TOKEN = process.env.DISCORD_TOKEN
exports.RIOT_API_TOKEN = process.env.RIOT_API_TOKEN
exports.GENIUS_API_TOKEN = process.env.GENIUS_API_TOKEN

// Log in the bot
const Discord = require('discord.js')
exports.client = new Discord.Client()
this.client.login(this.DISCORD_TOKEN)