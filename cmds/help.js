const utils = require("../utils.js");
const commands = require("../commands.js");

module.exports = (msg) => {
    msg.reply({
        embed: {
            color: 0x1d7ccf,
            thumbnail: {
                url: 'https://i.imgur.com/zcHXEgD.png',
            },
            fields: commands.list.filter(cmd => cmd.usage && cmd.desc).map(cmd => {
                return { name: cmd.usage, value: cmd.desc.replace(/%insult%/g, utils.getRandomInsult()) };
            })
        }
    });
};