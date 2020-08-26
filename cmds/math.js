const utils = require('../utils.js')
const { evaluate } = require('mathjs')

module.exports = (msg) => {
    const args = msg.content.split(" ")
    if (args.length < 2) {
        msg.reply(`Give me some math to do, ${utils.getRandomInsult()}`)
        return
    }

    try {
        msg.reply(evaluate(msg.content.replace("!math ", "")))
    } catch (err) {
        msg.reply(`I'm too much of a ${utils.getRandomInsult()} to do that shit\n\`\`\`css\n${err}\`\`\``)
    }
}