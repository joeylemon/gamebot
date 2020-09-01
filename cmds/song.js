const utils = require('../utils.js')
const constants = require("../constants.js")
const config = require("../config.js")

const searchYoutube = require('simpleyt')
const ytdl = require('ytdl-core')
const Genius = new (require("genius-lyrics")).Client(constants.GENIUS_API_TOKEN)

// Holds information about a song in the queue
class Song {
    constructor(msg, term) {
        this.id = Math.floor(Math.random() * 1000000)
        this.msg = msg
        this.term = term
        this.search()
    }

    /**
     * Loads the Genius and YouTube information for the song
     */
    search() {
        return new Promise((resolve, reject) => {
            // Skip search if we've already searched for this song
            if (this.song && this.yt)
                resolve()

            Genius.tracks.search(this.term, { limit: 1 })
                .then(results => {
                    this.song = results[0]
                    if (this.yt) resolve()
                })
                .catch(err => reject(err))

            searchYoutube(`${this.term} audio`, { filter: 'video' })
                .then(videos => {
                    this.yt = videos[0]
                    if (this.song) resolve()
                })
                .catch(err => reject(err))
        })
    }

    /**
     * Get how long the song has been playing in seconds
     */
    duration() {
        if (!this.dispatcher) return 0
        return Math.floor(this.dispatcher.streamTime / 1000)
    }

    /**
     * Get how many seconds left before the song ends
     */
    endTime() {
        return this.yt.length.sec - this.duration()
    }

    /**
     * Get how many seconds until this song begins
     */
    startTime() {
        let seconds = 0
        for (const song of queue) {
            if (song.id === this.id) break
            seconds += song.endTime()
        }
        return utils.formatSeconds(seconds)
    }

    /**
     * Get the name of the user who requested this song
     */
    requester() {
        return this.msg.author.username
    }

    /**
     * Play the song in the voice chat by streaming the YouTube audio
     * Additionally, print the lyrics to the song in an embed
     */
    async play() {
        await this.search()

        // If the bot isn't in the channel, go to it
        if (!utils.getVoiceConnection() && this.msg.member.voice.channel) {
            this.msg.member.voice.channel.join()
        }

        const that = this
        this.stream = ytdl(this.yt.uri)
        this.dispatcher = utils.getVoiceConnection().play(this.stream)
            .on('finish', () => {
                that.stop()
            })
            .on('error', err => {
                console.error(`Error playing stream: ${err}`)
            })

        const lyrics = await this.song.lyrics()
        const lyricsEnd = ` ...\n[View the rest on Genius](${this.song.url})`
        this.msg.reply({
            embed: {
                color: 0xffffff,
                title: `Now playing: ${this.song.titles.full}`,
                url: this.song.url,
                author: {
                    name: this.song.artist.name,
                    icon_url: this.song.artist.thumbnail,
                    url: this.song.artist.url,
                },
                thumbnail: {
                    url: this.song.raw.song_art_image_thumbnail_url,
                },
                fields: [
                    { "name": "Lyrics", "value": lyrics.slice(0, constants.LYRICS_LENGTH - lyricsEnd.length) + lyricsEnd }
                ],
                footer: {
                    text: `Released ${this.song.raw.release_date_for_display}`
                }
            }
        })
    }

    /**
     * End this song and move to the next song in the queue
     */
    stop() {
        if (this.stream) this.stream.destroy()
        if (this.dispatcher) this.dispatcher.destroy()

        // If the song has already been removed from queue, do nothing
        // Extraneous calls to stop() may come from destroying the stream
        if (!queue.find(s => s.id === this.id))
            return

        // Remove the song from the top of the queue
        queue.shift()

        if (queue.length > 0) {
            console.log(`play next song in queue: ${queue[0].song.title}`)
            queue[0].play()
        } else {
            console.log(`queue.length === ${queue.length}, disconnect`)
            utils.getVoiceConnection().disconnect()
        }
    }
}

// The list of songs in the queue
let queue = []

// The list of subcommands to the !song command
const subcommands = [
    {
        name: "help",
        action: (msg) => {
            msg.reply({
                embed: {
                    color: 0x1d7ccf,
                    thumbnail: {
                        url: 'https://i.imgur.com/zcHXEgD.png',
                    },
                    fields: subcommands.filter(cmd => cmd.usage && cmd.desc).map(cmd => {
                        return { name: cmd.usage, value: cmd.desc }
                    })
                }
            })
        }
    },
    {
        name: "shuffle",
        usage: "!song shuffle",
        desc: "Shuffle songs using the collaborative Spotify playlist",
        action: (msg) => {
            utils.getSpotifyPlaylist(config.get("spotify_playlist_id"))
                .then(async (playlist) => {
                    const tracks = utils.shuffle(playlist.tracks.items).slice(0, 5)
                    for (const track of tracks) {
                        const term = `${track.track.name.split(" (")[0]} ${track.track.artists[0].name}`
                        console.log("searching song", term)

                        queue.push(new Song(msg, term))

                        if (queue.length === 1)
                            queue[0].play()
                    }
                    msg.reply("Added random songs from the Spotify playlist to the queue\nUse `!song queue` to view the queue")
                })
                .catch(err => console.error(err))
        }
    },
    {
        name: "queue",
        usage: "!song queue",
        desc: "View the current queue",
        action: (msg) => {
            if (queue.length <= 1) {
                msg.reply(`There aren't any songs in the queue, ${utils.getRandomInsult()}`)
                return
            }

            let searched = 0
            for (const song of queue) {
                song.search()
                    .then(() => {
                        searched++

                        if (searched === queue.length) {
                            msg.reply({
                                embed: {
                                    color: 0xffffff,
                                    thumbnail: {
                                        url: queue[1].song.raw.song_art_image_thumbnail_url,
                                    },
                                    fields: queue.slice(1, queue.length).map(song => {
                                        return {
                                            name: song.song.titles.full,
                                            value: `Will play in ${song.startTime()}\n*Requested by ${song.requester()}*`
                                        }
                                    })
                                }
                            })
                        }
                    })
                    .catch(err => console.error(err))
            }
        }
    },
    {
        name: "skip",
        usage: "!song skip",
        desc: "Move to the next song in the queue",
        action: (msg) => {
            if (queue.length > 0)
                queue[0].stop()
            else
                msg.reply(`There's no song to skip, ${utils.getRandomInsult()}`)
        }
    },
    {
        name: "stopall",
        usage: "!song stopall",
        desc: "Reset the queue and stop playing music",
        action: (msg) => {
            for (const song of queue) {
                if (song.stream) song.stream.destroy()
                if (song.dispatcher) song.dispatcher.destroy()
            }

            queue = []
            if (utils.getVoiceConnection())
                utils.getVoiceConnection().disconnect()
        }
    },
    {
        name: "pause",
        aliases: ["stop"],
        usage: "!song pause",
        desc: "Pause the current song",
        action: (msg) => {
            if (queue.length === 0) {
                msg.reply(`There's no song to pause, ${utils.getRandomInsult()}`)
                return
            }

            if (queue[0].dispatcher.paused) {
                msg.reply(`The song is already paused, ${utils.getRandomInsult()}`)
                return
            }

            queue[0].dispatcher.pause()
            msg.reply(`**${queue[0].song.titles.full}** has been paused\n*Resume it with* \`!song resume\`\n*Skip it with* \`!song skip\``)
        }
    },
    {
        name: "resume",
        aliases: ["play"],
        usage: "!song resume",
        desc: "Resume the current song",
        action: (msg) => {
            if (queue.length === 0) {
                msg.reply(`There's no song to resume, ${utils.getRandomInsult()}`)
                return
            }

            if (!queue[0].dispatcher.paused) {
                msg.reply(`The song isn't even paused, ${utils.getRandomInsult()}`)
                return
            }

            queue[0].dispatcher.resume()
            msg.reply(`**${queue[0].song.titles.full}** has been resumed`)
        }
    }
]

module.exports = async (msg) => {
    if (msg.content.split(" ").length <= 1) {
        msg.reply(`Give me a song to look for, ${utils.getRandomInsult()}`)
        return
    }

    const term = msg.content.replace("!song ", "")

    // Check if the given term is a subcommand
    const subcmd = subcommands.find(c => c.name === term) || subcommands.find(c => c.aliases && c.aliases.includes(term))
    if (subcmd) {
        subcmd.action(msg)
        return
    }

    if (!msg.member.voice.channel) {
        msg.reply(`You're not in a voice channel, ${utils.getRandomInsult()}`)
        return
    }

    // Add to queue
    const queueSong = new Song(msg, term)
    queue.push(queueSong)

    if (queue.length === 1) {
        msg.reply("Searching songs ...")
        queue[0].play()
    } else {
        await queueSong.search()
        msg.reply({
            embed: {
                color: 0xffffff,
                title: queueSong.song.titles.full,
                url: queueSong.song.url,
                author: {
                    name: queueSong.song.artist.name,
                    icon_url: queueSong.song.artist.thumbnail,
                    url: queueSong.song.artist.url,
                },
                thumbnail: {
                    url: queueSong.song.raw.song_art_image_thumbnail_url,
                },
                fields: [
                    {
                        name: "Added song to the queue",
                        value: `Will play in ${queueSong.startTime()} (${queue.length === 2 ? "Up next" : `${queue.length - 2} songs ahead in queue`})`
                    }
                ],
                footer: {
                    text: `Released ${queueSong.song.raw.release_date_for_display}`
                }
            }
        })
    }
}

/*
Example spotify playlist
{
  collaborative: false,
  description: 'New music from A Boogie Wit da Hoodie, Cordae and Big Sean.',
  external_urls: {
    spotify: 'https://open.spotify.com/playlist/37i9dQZF1DX0XUsuxWHRQd'
  },
  followers: { href: null, total: 13285670 },
  href: 'https://api.spotify.com/v1/playlists/37i9dQZF1DX0XUsuxWHRQd',
  id: '37i9dQZF1DX0XUsuxWHRQd',
  images: [
    {
      height: null,
      url: 'https://i.scdn.co/image/ab67706f00000003c77d3f19f60b599489aa58db',
      width: null
    }
  ],
  name: 'RapCaviar',
  owner: {
    display_name: 'Spotify',
    external_urls: { spotify: 'https://open.spotify.com/user/spotify' },
    href: 'https://api.spotify.com/v1/users/spotify',
    id: 'spotify',
    type: 'user',
    uri: 'spotify:user:spotify'
  },
  primary_color: '#F49B23',
  public: true,
  snapshot_id: 'MTU5ODU4NzMwNiwwMDAwMDRjNDAwMDAwMTc0MzMzYTgwOGIwMDAwMDE3NDMxODUyOTgw',
  tracks: {
    href: 'https://api.spotify.com/v1/playlists/37i9dQZF1DX0XUsuxWHRQd/tracks?offset=0&limit=100',
    items: [
      [Object], [Object], [Object], [Object],
      [Object], [Object], [Object], [Object],
      [Object], [Object], [Object], [Object],
      [Object], [Object], [Object], [Object],
      [Object], [Object], [Object], [Object],
      [Object], [Object], [Object], [Object],
      [Object], [Object], [Object], [Object],
      [Object], [Object], [Object], [Object],
      [Object], [Object], [Object], [Object],
      [Object], [Object], [Object], [Object],
      [Object], [Object], [Object], [Object],
      [Object], [Object], [Object], [Object],
      [Object], [Object]
    ],
    limit: 100,
    next: null,
    offset: 0,
    previous: null,
    total: 50
  },
  type: 'playlist',
  uri: 'spotify:playlist:37i9dQZF1DX0XUsuxWHRQd'
}
*/

/*
Example await searchYoutube(term, { filter: 'video' }) video
{
  type: 'video',
  identifier: 'fazMSCZg-mw',
  uri: 'https://www.youtube.com/watch?v=fazMSCZg-mw',
  title: 'Pop Smoke - Hello (Audio) ft. A Boogie Wit da Hoodie',
  author: {
    name: 'POP SMOKE',
    profile: 'https://yt3.ggpht.com/a-/AOh14Gg5p4cNX9FW86mot7xg7RMGOvCgdeAYGDZwkw=s68-c-k-c0x00ffffff-no-rj-mo',
    uri: 'https://www.youtube.com/channel/UCSaPKJpNd-Mkm6hhelIYSlQ'
  },
  length: { ms: 192000, sec: 192 },
  isStream: false,
  thumbnails: [
    {
      url: 'https://i.ytimg.com/vi/fazMSCZg-mw/hqdefault.jpg?sqp=-oaymwEiCKgBEF5IWvKriqkDFQgBFQAAAAAYASUAAMhCPQCAokN4AQ==&rs=AOn4CLBurC3IMBaAyusmuM0sDIxM7DqWTA',
      width: 168,
      height: 94
    },
    {
      url: 'https://i.ytimg.com/vi/fazMSCZg-mw/hqdefault.jpg?sqp=-oaymwEiCMQBEG5IWvKriqkDFQgBFQAAAAAYASUAAMhCPQCAokN4AQ==&rs=AOn4CLAQ2ySRbjlj0r1zUA2gam-CcMkY1Q',
      width: 196,
      height: 110
    },
    {
      url: 'https://i.ytimg.com/vi/fazMSCZg-mw/hqdefault.jpg?sqp=-oaymwEjCPYBEIoBSFryq4qpAxUIARUAAAAAGAElAADIQj0AgKJDeAE=&rs=AOn4CLDm61vac-nwSMQ8wo0b-7rZBmen6g',
      width: 246,
      height: 138
    },
    {
      url: 'https://i.ytimg.com/vi/fazMSCZg-mw/hqdefault.jpg?sqp=-oaymwEjCNACELwBSFryq4qpAxUIARUAAAAAGAElAADIQj0AgKJDeAE=&rs=AOn4CLAhHqb1zexrWeLKAdHplYgwGITMYw',
      width: 336,
      height: 188
    }
  ]
}
*/

/* Example Genius.tracks.search(term, { limit: 1 }) song
[ Track {
    title: 'Hello',
    titles: { full: 'Hello by Adele', featured: 'Hello' },
    id: 2332455,
    thumbnail: 'https://images.genius.com/077abb7599bf12912ada980edde48651.300x169x1.jpg',
    image: 'https://images.genius.com/077abb7599bf12912ada980edde48651.1000x563x1.jpg',
    url: 'https://genius.com/Adele-hello-lyrics',
    artist:
     Artist {
       name: 'Adele',
       id: 2300,
       url: 'https://genius.com/artists/Adele',
       thumbnail: 'https://images.genius.com/2dfd665a4ae64d9e23534c1cca7b8a03.999x999x1.jpg',
       image: 'https://images.genius.com/2a44416083dd36132512a635596d8589.1000x661x1.jpg',
       iq: null,
       socialmedia: [Object],
       verified: [Object],
       user: null,
       raw: [Object],
       key: 'SFHPQlPfFwf1svFmqw5c_VsJ2R1DwS0bCGRbURtzvOqkdR2zvUOALw1J-DPX0Ghp' },
    album:
     { api_path: '/albums/133542',
       cover_art_url: 'https://images.genius.com/974af98aba9edb83556c665e670bfef9.1000x1000x1.jpg',
       full_title: '25  by Adele',
       id: 133542,
       name: '25 ',
       url: 'https://genius.com/albums/Adele/25',
       artist: [Object] },
    releasedAt: '2015-10-23',
    stats:
     { accepted_annotations: 13,
       contributors: 177,
       iq_earners: 177,
       transcribers: 4,
       unreviewed_annotations: 0,
       verified_annotations: 0,
       concurrents: 5,
       hot: false,
       pageviews: 4837596 },
    featured: true,
    raw:
     { annotation_count: 14,
       api_path: '/songs/2332455',
       apple_music_id: '1051394215',
       apple_music_player_url: 'https://genius.com/songs/2332455/apple_music_player',
       description: [Object],
       embed_content: '<div id=\'rg_embed_link_2332455\' class=\'rg_embed_link\' data-song-id=\'2332455\'>Read <a href=\'https://genius.com/Adele-hello-lyrics\'>“Hello” by Adele</a> on Genius</div> <script crossorigin src=\'//genius.com/songs/2332455/embed.js\'></script>',
       featured_video: true,
       full_title: 'Hello by Adele',
       header_image_thumbnail_url: 'https://images.genius.com/077abb7599bf12912ada980edde48651.300x169x1.jpg',
       header_image_url: 'https://images.genius.com/077abb7599bf12912ada980edde48651.1000x563x1.jpg',
       id: 2332455,
       lyrics_owner_id: 672397,
       lyrics_placeholder_reason: null,
       lyrics_state: 'complete',
       path: '/Adele-hello-lyrics',
       pyongs_count: 223,
       recording_location: 'Metropolis Studios, London',
       release_date: '2015-10-23',
       release_date_for_display: 'October 23, 2015',
       song_art_image_thumbnail_url: 'https://images.genius.com/56fe4a76d3a480e425824b2e18a2e983.300x300x1.jpg',
       song_art_image_url: 'https://images.genius.com/56fe4a76d3a480e425824b2e18a2e983.1000x1000x1.jpg',
       stats: [Object],
       title: 'Hello',
       title_with_featured: 'Hello',
       url: 'https://genius.com/Adele-hello-lyrics',
       current_user_metadata: [Object],
       album: [Object],
       custom_performances: [Array],
       description_annotation: [Object],
       featured_artists: [],
       lyrics_marked_complete_by: null,
       media: [Array],
       primary_artist: [Object],
       producer_artists: [Array],
       song_relationships: [Array],
       verified_annotations_by: [],
       verified_contributors: [],
       verified_lyrics_by: [],
       writer_artists: [Array] } } ]
*/