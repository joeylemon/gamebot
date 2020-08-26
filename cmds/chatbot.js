const utils = require("../utils.js")
const constants = require("../constants.js")
const cleverbot = require("cleverbot-free")
const fs = require('fs')

// The cleverbot needs context of the previous messages
let BOT_CONTEXT = {}

// Give the bot some sentences with custom responses
const customResponses = {
    "what do your organs look like":
        (msg) => {
            // Reply with the contents of bot.js
            fs.readFile("/home/dustin/discord/bot.js", "utf8", function (err, data) {
                if (err) {
                    console.error(err)
                    return
                }
                msg.reply("```js\n" + data + "\n```")
            })
        },

    "why does dustin suck":
        (msg) => {
            const name = utils.getDiscordMap()[msg.author.id].real_name
            msg.reply(utils.getRandomElement([
                "Dustin Craig has daddy issues.",
                "I don't know, just check his League match history.",
                `Probably because he knows he's not as cool as you, ${name ? name : utils.getRandomInsult()}`,
                "Craig boy is just trying his best."]))
        },

    "you're stupid": (msg) => { msg.react('👎') }
}

module.exports = (msg) => {
    const args = msg.content.split(" ")

    if (args.length < 2) {
        // If there are no arguments given, print usage
        msg.reply(`What do you want to say to the bot, ${utils.getRandomInsult()}?`)
        return
    }

    // Remove the "bot," identifier
    const sentence = msg.content.replace("bot, ", "")

    // Check if we've defined a custom action for this sentence
    for (const resp in customResponses) {
        if (sentence.toLowerCase().indexOf(resp) != -1) {
            customResponses[resp](msg)
            return
        }
    }

    if (!BOT_CONTEXT[msg.author.id])
        BOT_CONTEXT[msg.author.id] = new Array()

    // Otherwise, query for a response from the cleverbot api
    cleverbot(sentence, BOT_CONTEXT[msg.author.id]).then(response => {
        BOT_CONTEXT[msg.author.id].push(sentence)
        BOT_CONTEXT[msg.author.id].push(response)
        msg.reply(response)
    })
}