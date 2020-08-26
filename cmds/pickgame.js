const utils = require("../utils.js")

let TEMP_GAMELIST = utils.shuffle(utils.getGames())

module.exports = (msg) => {
    // Use a temporary list of games so we can make sure the next game will be different
    // if we decide we don't like the game choice
    if (TEMP_GAMELIST.length === 0)
        TEMP_GAMELIST = utils.shuffle(utils.getGames())

    const game = TEMP_GAMELIST[0]
    msg.channel.send(`You're gonna play **${game.name}**, ${utils.getRandomInsult()}`, { files: [game.icon] })

    // Remove the first element from the temp list
    TEMP_GAMELIST.splice(0, 1)
}