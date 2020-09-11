/**
 * Discord bot for our gaming server
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
    console.info(`Logged in as ${constants.client.user.tag}!`)
})

constants.client.on('message', msg => {
    // Don't listen for our own messages
    if (msg.author.bot) return

    // Helper function to reply
    msg.reply = (str) => { msg.channel.send(str) }

    const contents = msg.content.toLowerCase()

    for (const cmd of commands.list) {
        // Check if the user typed this command
        if (contents.split(" ")[0] === cmd.name || (cmd.contains && contents.includes(cmd.name)))
            return cmd.action(msg)

        // Check this command's aliases as well
        const subcmd = cmd.aliases ? cmd.aliases.find(a => contents.startsWith(a)) : null
        if (subcmd)
            return cmd.action(msg)
    }

    if (msg.content.startsWith("!"))
        msg.reply(`That's not a real command, you ${utils.getRandomInsult()}`)
})
