const utils = require('../utils.js')
const constants = require("../constants.js")
const moment = require('moment-timezone')
const request = require('request')
const jsdom = require("jsdom")
const { JSDOM } = jsdom

// Create league api wrapper
const { Kayn } = require('kayn')
const kayn = Kayn(constants.RIOT_API_TOKEN)({})

/**
 * Find a player's League ID
 * @param {string} name The name of the league player
 * @usage
 *     getSummonerID("Labowski").then(id => console.log(id));
 */
function getSummonerID(name) {
    return new Promise((resolve, reject) => {
        kayn.Summoner.by.name(name)
            .then(summoner => resolve(summoner.id))
            .catch(error => reject(error))
    })
}

/**
 * Determine which team is the enemy team
 * @param {KaynRequest<SpectatorV4CurrentGameInfo>} game The kayn object for the current game
 */
function findEnemyTeamID(game) {
    const discordMap = utils.getDiscordMap()
    const ids = Object.keys(discordMap).map(key => discordMap[key].league_id)

    for (const player of game.participants) {
        if (ids.indexOf(player.summonerId) > -1)
            // Since one of us is on this team, return the opposite team's id
            return player.teamId === 100 ? 200 : 100
    }

    return 100
}

/**
 * Get the enemy players and the start time of the user's current game
 * @param {string} summonerID The League user id of the message sender
 */
function getCurrentGame(summonerID) {
    return new Promise((resolve, reject) => {
        kayn.CurrentGame.by.summonerID(summonerID)
            .then(game => {
                const enemyTeamID = findEnemyTeamID(game)
                let startTime = ""

                // For some reason the API is returning December 31st 1969 start time for some games
                if (game.gameStartTime > 1000000000) {
                    const time = moment(game.gameStartTime).tz("America/New_York")
                    startTime = `Match began at ${time.format("h:mma [on] MMMM Do YYYY")} (${time.fromNow()})`
                } else {
                    console.log(game)
                }

                resolve({
                    startTime: startTime,
                    enemies: game.participants.filter(p => p.teamId === enemyTeamID)
                })
            }).catch(error => reject(error))
    })
}

/**
 * Parse the given op.gg url and extract useful information like win rates, recent games, etc
 * @param {string} url The op.gg url
 */
function getFullInformation(url) {
    return new Promise((resolve, reject) => {
        request(url, (error, response, body) => {
            if (error || response.statusCode !== 200) {
                reject(error)
            }

            let document = new JSDOM(body).window.document
            const playerHTMLObjects = Array.from(document.querySelector(".multi2__list").children)
            let data = {}

            for (const obj of playerHTMLObjects) {
                const recentGamesObject = obj.querySelector(".recent-matches > .recent-games")
                const recentGames = recentGamesObject !== null ? Array.from(recentGamesObject.children) : []

                const mostChampions = Array.from(obj.querySelector(".most-champions").children)

                const hasPreference = obj.querySelector(".summoner-summary > .tier-position > .most-position") !== null
                const hasWinData = obj.querySelector(".graph > .bar-graph > .winratio") !== null

                const nameObject = obj.querySelector(".summoner-summary > .summoner-name > a")
                const name = nameObject !== null ? nameObject.innerHTML.trim() : "Unknown"

                const winrate = hasWinData ? parseInt(obj.querySelector(".graph > .bar-graph > .winratio").innerHTML.slice(0, -1)) : 0
                const wins = hasWinData ? parseInt(obj.querySelector(".graph > .bar-graph > .base > .win").innerHTML.slice(0, -1)) : 0
                const losses = hasWinData ? Math.ceil(wins / (winrate / 100)) - wins : 0

                data[name] = {
                    rank: obj.querySelector(".lp").innerHTML,
                    preference: hasPreference ? obj.querySelector(".summoner-summary > .tier-position > .most-position").children[0].className.split("--")[1] : "Unknown",
                    winrate: winrate,
                    wins: wins,
                    losses: losses,
                    recents: recentGames.map(obj => {
                        return {
                            champion: obj.querySelector(".champion").title,
                            win: obj.querySelector(".is-win").className.split("--")[1].trim() === "true",
                            kills: parseInt(obj.querySelector(".is-win > .kill").innerHTML),
                            deaths: parseInt(obj.querySelector(".is-win > .death").innerHTML),
                            assists: parseInt(obj.querySelector(".is-win > .assist").innerHTML),
                            time: moment.tz(obj.querySelector(".time-stamp > ._timeago").innerHTML, "Asia/Tokyo")
                        }
                    }),
                    favorites: mostChampions.map(obj => {
                        return {
                            champion: obj.querySelector(".champion").title,
                            kda: obj.querySelector(".kda > .ratio").innerHTML,
                            games: parseInt(obj.querySelector(".game-count").innerHTML),
                            winrate: obj.querySelector(".win-ratio > .ratio").innerHTML
                        }
                    })
                }
            }

            resolve(data)
        })
    })
}

async function action(msg) {
    const discordUser = utils.getDiscordMap()[msg.author.id]
    if (!discordUser) {
        msg.reply(`I don't know your league username, ${utils.getRandomInsult()}`)
        return
    }

    const id = discordUser.league_id
    //const id = await getSummonerID("Nightblue3");

    // Attempt to retrieve the current game of the user
    const game = await getCurrentGame(id)
        .catch(error => {
            if (error.statusCode && error.statusCode === 403) {
                // 403 Forbidden
                msg.reply(`Your API key is expired, ${utils.getRandomInsult()}`)
            } else if (error.statusCode && error.statusCode === 404) {
                // 404 Not Found
                msg.reply(`It doesn't look like you're in a game right now, ${utils.getRandomInsult()}`)
            } else {
                // Unknown error
                console.error(error)
                msg.reply(`Something went wrong, ${utils.getRandomInsult()}`)
            }
            return false
        })
    if (!game) return

    // Scrape the op.gg page and extract information
    const url = `https://na.op.gg/multi/query=${encodeURIComponent(game.enemies.map(u => u.summonerName).join(","))}`
    const players = await getFullInformation(url)
        .catch(error => {
            console.error(error)
            msg.reply(`Something went wrong, ${utils.getRandomInsult()}`)
            return false
        })
    if (!players) return

    console.log(url)

    msg.reply({
        embed: {
            color: 0xffffff,
            title: `Click here to view your current opponents on OP.GG`,
            url: url,
            author: {
                name: 'League of Legends',
                icon_url: 'https://i.imgur.com/5bq3j5V.png',
                url: url
            },
            thumbnail: {
                url: 'https://i.imgur.com/CFzOvt2.png'
            },
            image: {
                url: `http://ddragon.leagueoflegends.com/cdn/img/champion/splash/${encodeURIComponent(utils.getChampion(utils.getRandomElement(game.enemies).championId).id)}_0.jpg`
            },
            footer: {
                text: game.startTime
            },
            fields: game.enemies.map(u => {
                const data = players[u.summonerName.trim()]

                if (data) {
                    // Show the last 4 historical games
                    const games = data.recents.slice(0, 4).map(g => {
                        return `*${g.time.fromNow()}* ${g.win ? "won" : "lost"} ${g.champion} with KDA ${g.kills}/${g.deaths}/${g.assists}`
                    })

                    const favorite = data.favorites[0]
                    const main = favorite ? `__**Main:**__ ${favorite.champion} ${favorite.kda} ${favorite.winrate} win rate (of ${favorite.games})\n` : ``

                    const name = `${u.summonerName} (${utils.getChampion(u.championId).id})`
                    const value = `__**Rank:**__ ${data.rank} ${data.preference}\n__**Wins:**__ ${data.wins}W ${data.losses}L (${data.winrate}%)\n${main}${games.join("\n")}`

                    return { "name": name, "value": value }
                } else {
                    return { "name": u.summonerName, "value": utils.getChampion(u.championId).id }
                }
            })
        }
    })
}

module.exports = action


/**
 * Example game
 * { gameId: 3418701558,
  mapId: 11,
  gameMode: 'CLASSIC',
  gameType: 'MATCHED_GAME',
  gameQueueConfigId: 420,
  participants:
   [ { teamId: 100,
       spell1Id: 6,
       spell2Id: 11,
       championId: 120,
       profileIconId: 1447,
       summonerName: 'disseverything',
       bot: false,
       summonerId: '-4LnunsyeU3Nf8mA23zjQGlqXR5XQrXji7Qpb6jdZF-Ch5-P',
       gameCustomizationObjects: [],
       perks: [Object] },
     { teamId: 100,
       spell1Id: 14,
       spell2Id: 4,
       championId: 38,
       profileIconId: 3375,
       summonerName: 'Brynnn',
       bot: false,
       summonerId: 'IdPSg4gQJPRS2LYg3vuN9f_BcX8gBR0IO1Upt46zRHn3z10',
       gameCustomizationObjects: [],
       perks: [Object] },
     { teamId: 100,
       spell1Id: 4,
       spell2Id: 21,
       championId: 16,
       profileIconId: 3379,
       summonerName: 'dragonmaster9890',
       bot: false,
       summonerId: 'NvMPhcnr9b2XIkrCi9l-x_cisCiV0uUVEVOKPuohLS_G9Zk',
       gameCustomizationObjects: [],
       perks: [Object] },
     { teamId: 100,
       spell1Id: 4,
       spell2Id: 12,
       championId: 429,
       profileIconId: 7,
       summonerName: '1v3 top',
       bot: false,
       summonerId: 'jKh_cZfD6BWpa4arfvazmVw-c0IMhTozestv3lCojM-SChcb',
       gameCustomizationObjects: [],
       perks: [Object] },
     { teamId: 100,
       spell1Id: 7,
       spell2Id: 4,
       championId: 22,
       profileIconId: 4568,
       summonerName: 'masterm0',
       bot: false,
       summonerId: 'IMLQ9BVFV6qnAUbgeXJe4_WtkeJnXAoJMXV_lNGwLncHYuE',
       gameCustomizationObjects: [],
       perks: [Object] },
     { teamId: 200,
       spell1Id: 4,
       spell2Id: 14,
       championId: 50,
       profileIconId: 3587,
       summonerName: 'Danger Penguin',
       bot: false,
       summonerId: 'DQTOtY06X-hrtLkyglZUsR3IvdJ-ygp8nS9lAmUxtMqqrzk',
       gameCustomizationObjects: [],
       perks: [Object] },
     { teamId: 200,
       spell1Id: 11,
       spell2Id: 4,
       championId: 20,
       profileIconId: 4405,
       summonerName: 'SNOWBALLDRIFTR69',
       bot: false,
       summonerId: 'GFWKXbLqrJmimjT4XtI0tSaTQ0n_kwiZ650zaqlLwucqD005',
       gameCustomizationObjects: [],
       perks: [Object] },
     { teamId: 200,
       spell1Id: 12,
       spell2Id: 4,
       championId: 106,
       profileIconId: 3233,
       summonerName: 'Luc1236060',
       bot: false,
       summonerId: 'l0z1GqSg4JXJb6hIiDeKTDKePZM2ybSEsivhmarGVPpDYF4',
       gameCustomizationObjects: [],
       perks: [Object] },
     { teamId: 200,
       spell1Id: 7,
       spell2Id: 4,
       championId: 81,
       profileIconId: 4368,
       summonerName: 'iPhone 10s',
       bot: false,
       summonerId: 'OOzb_qyRUPbAX3CQlGw7D8uw8BLwc8Ta9Pqqsf6RX1hs7Tg',
       gameCustomizationObjects: [],
       perks: [Object] },
     { teamId: 200,
       spell1Id: 4,
       spell2Id: 14,
       championId: 55,
       profileIconId: 4027,
       summonerName: 'Taekwonm',
       bot: false,
       summonerId: 'EcDI0_FdNCazPFpuHWDLptWPebliwqtlo5H80ayohjVYEnw',
       gameCustomizationObjects: [],
       perks: [Object] } ],
  observers: { encryptionKey: 'MXjfQMxLhTKBwN+uqODGiNF62If0XWP/' },
  platformId: 'NA1',
  bannedChampions:
   [ { championId: 350, teamId: 100, pickTurn: 1 },
     { championId: -1, teamId: 100, pickTurn: 2 },
     { championId: 89, teamId: 100, pickTurn: 3 },
     { championId: 28, teamId: 100, pickTurn: 4 },
     { championId: 104, teamId: 100, pickTurn: 5 },
     { championId: 141, teamId: 200, pickTurn: 6 },
     { championId: 131, teamId: 200, pickTurn: 7 },
     { championId: 8, teamId: 200, pickTurn: 8 },
     { championId: 11, teamId: 200, pickTurn: 9 },
     { championId: 104, teamId: 200, pickTurn: 10 } ],
  gameStartTime: 1589388756649,
  gameLength: 648 }


 *
 * Example summoner
 * { id: '1V9sJKJ82j72y2hgifipA_afk0LInJwmrjpAbxSUMzhdLvk',
  accountId: 'DCQK9hbrZRzvQ-QXoJ8rfGmaRNBnvpuAIM1spWcCnE-cCg',
  puuid: 'APLb2JBSstRovvAfhCHBSC4Y1E4EPeRIcAtfa95FibezxnIAWQeem775YdS1ZZliG8A3uZOD2zs7iQ',
  name: 'JjPwN1',
  profileIconId: 23,
  revisionDate: 1589345997000,
  summonerLevel: 37 }


 *
 * Example league entries
 * [ { leagueId: 'b1d79555-54cd-4f44-8b88-a88589e2396c',
    queueType: 'RANKED_FLEX_SR',
    tier: 'BRONZE',
    rank: 'IV',
    summonerId: '1V9sJKJ82j72y2hgifipA_afk0LInJwmrjpAbxSUMzhdLvk',
    summonerName: 'JjPwN1',
    leaguePoints: 59,
    wins: 3,
    losses: 9,
    veteran: false,
    inactive: false,
    freshBlood: false,
    hotStreak: false } ]
 */