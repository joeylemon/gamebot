const schedule = require('node-schedule')
const utils = require('../utils.js')
const constants = require('../constants.js')
const config = require('../config.js')

function scheduleBirthdayMessages() {
    const ids = config.get("discord_ids")

    const users = Object.keys(ids).
        filter(key => ids[key].birthday !== undefined).
        map(key => ids[key])

    for (const user of users) {
        const bday = new Date(user.birthday)
        bday.setFullYear(new Date().getFullYear())

        schedule.scheduleJob(bday, () => {
            constants.client.channels.fetch(config.get("discord_channel_id"))
                .then(channel => {
                    channel.send(`Happy birthday ${user.real_name}, you little ${utils.getRandomInsult()}`, { files: ["https://i.imgur.com/KKgL784.gif"] })
                })
                .catch(err => console.error(`Cannot send birthday message: ${err}`))
        })
    }
}

scheduleBirthdayMessages()

module.exports = (msg) => {
    const args = msg.content.split(" ")
    if (args.length !== 2) {
        msg.reply(`Whose birthday is it, ${utils.getRandomInsult()}?`)
        return
    }

    msg.channel.send(`Happy birthday ${utils.capitalize(args[1])}, you little ${utils.getRandomInsult()}`, { files: ["https://i.imgur.com/KKgL784.gif"] })
}