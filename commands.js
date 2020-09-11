const utils = require("./utils.js")

/**
 * A command can have the following properties
 * 
 * name     [string]
 *      The command string
 * 
 * action   [function]
 *      The function to execute upon receiving the command
 * 
 * desc     [string]        (optional)
 *      The description of the command
 * 
 * usage    [string]        (optional)
 *      An example of how to use the command
 * 
 * aliases  [string array]  (optional)
 *      A list of aliases
 * 
 * contains [boolean]       (optional)
 *      Whether or not to check if the entire line simply contains the command name
 */
const commands = [

    {
        name: "!purge",
        action: require("./cmds/purge.js"),
        desc: "Delete the last 100 messages"
    },
    {
        name: "!help",
        aliases: ["help me daddy", "daddy i need help"],
        action: require("./cmds/help.js")
    },

    {
        name: "!pick",
        usage: "!pick option 1, option 2, ...",
        desc: "Chooses for you indecisive %insult%s",
        action: require('./cmds/pick.js')
    },

    {
        name: "!pickgame",
        usage: "!pickgame",
        aliases: ["what's it gonna be tonight", "what are the boys playing"],
        desc: "Chooses which game it's gonna be tonight",
        action: require('./cmds/pickgame.js')
    },

    {
        name: "!pickmap",
        usage: "!pickmap",
        aliases: ["dust or mirage?", "map me bro", "you have a fat map"],
        desc: "Chooses which map you %insult%s will play in CS:GO",
        action: (msg) => {
            msg.reply(`It's **${utils.getRandomElement(utils.getMaps())}** time, ${utils.getRandomInsult()}`)
        }
    },

    {
        name: "!pickroles",
        usage: "!pickroles",
        aliases: ["bitch, pick our roles"],
        desc: "Chooses which role you %insult%s will play in League",
        action: require('./cmds/pickroles.js')
    },

    {
        name: "!song",
        usage: "!song help",
        desc: "Shuffle the Spotify playlist and/or build a queue of songs",
        action: require('./cmds/song.js')
    },

    {
        name: "!match",
        usage: "!match",
        desc: "List the enemy %insult%s' stats for League",
        action: require("./cmds/match.js")
    },

    {
        name: "!insult",
        usage: "!insult <person>",
        desc: "Tell a %insult% off",
        action: require('./cmds/insult.js')
    },

    {
        name: "!math",
        usage: "!math <expression>",
        desc: "Do some math because you %insult%s can't",
        action: require('./cmds/math.js')
    },

    {
        name: "bot,",
        usage: "bot, <sentence>",
        desc: "Talk to the %insult% bot",
        action: require('./cmds/chatbot.js')
    },

    {
        name: "rick roll",
        contains: true,
        action: (msg) => { msg.reply('https://www.youtube.com/watch?v=dQw4w9WgXcQ') }
    },

    {
        name: "dustin sucks",
        contains: true,
        action: (msg) => {
            const msgs = ["yes", "he does suck doesn't he", "that's true"]
            msg.reply(utils.getRandomElement(msgs))
        }
    }
]

exports.list = commands
