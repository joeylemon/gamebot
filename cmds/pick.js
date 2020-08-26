const utils = require('../utils.js');

module.exports = (msg) => {
    const args = msg.content.split(" ");

    // Remove the command argument, split the list by ", " or ","
    const options = args.slice(1, args.length).join(" ").split(/, |,/);

    if (args.length === 1) {
        // If there are no arguments given, print usage
        msg.reply(`You oughta give me a list of things to choose from, ${utils.getRandomInsult()}\nPick a game with \`!pickgame\` or pick a map with \`!pickmap\``);
        return;
    }

    msg.reply(`That's gonna be **${utils.getRandomElement(options)}**, ${utils.getRandomInsult()}`);
};