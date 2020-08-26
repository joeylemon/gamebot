const utils = require("../utils.js")

module.exports = (msg) => {
    const args = msg.content.split(" ")

    if (args.length < 2) {
        // If there are no arguments given, print usage
        msg.reply(`Give me someone to insult you ${utils.getRandomInsult()}`)
        return
    }

    // .find() doesn't work for some reason?
    const discordMap = utils.getDiscordMap()
    let id
    for (const key of Object.keys(discordMap)) {
        if (discordMap[key].real_name.toLowerCase() === args[1].toLowerCase())
            id = key
    }

    // If we know their id, tag them. Otherwise, just use the given name
    let name = id ? `<@${id}>` : utils.capitalize(args[1], true)

    msg.reply(`${name} is a little ${utils.getRandomInsult()}, ${utils.getRandomElement(["on god", "no cap"])}`)
}
