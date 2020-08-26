/**
 * Discord bot for #bigdickplays
 * 
 * Run it:
 *      make run
 * 
 * Run it in the background:
 *      make forever
 *
 * Stop it:
 *      make stop
 */

const constants = require('./constants.js')
const utils = require('./utils.js')
const commands = require("./commands.js")

constants.client.on('ready', () => {
    console.info(`# insults: ${utils.getInsults().length}`)
    console.info(`Logged in as ${constants.client.user.tag}!`)
})

constants.client.on('message', msg => {
    // Don't listen for our own messages
    if (msg.author.bot) return

    // Helper function to reply
    msg.reply = (str) => { msg.channel.send(str) }

    for (const cmd of commands.list) {
        let contents = msg.content.toLowerCase()
        let args = contents.split(" ")

        if (args[0] === cmd.name || (cmd.contains && contents.indexOf(cmd.name) != -1)) {
            cmd.action(msg)
            return
        }

        // Check the command's aliases as well
        if (cmd.aliases) {
            for (const alias of cmd.aliases) {
                if (contents.startsWith(alias)) {
                    cmd.action(msg)
                    return
                }
            }
        }
    }

    if (msg.content.startsWith("!"))
        msg.reply(`That's not a real command, you ${utils.getRandomInsult()}`)
})
