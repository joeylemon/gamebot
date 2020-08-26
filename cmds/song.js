const utils = require('../utils.js');
const constants = require("../constants.js");
const Genius = new (require("genius-lyrics")).Client(constants.GENIUS_API_TOKEN);

module.exports = (msg) => {
    const args = msg.content.split(" ");
    if (args.length <= 1) {
        msg.reply(`Give me a song to look for, ${utils.getRandomInsult()}`);
        return;
    }

    msg.reply("Searching songs ...");

    const term = msg.content.replace("!song ", "");
    let song;

    Genius.tracks.search(term, { limit: 1 })
        .then(results => {
            song = results[0];
            return song.lyrics();
        })
        .then(lyrics => {
            const lyricsEnd = ` ...\n[View the rest on Genius](${song.url})`;
            msg.reply({
                embed: {
                    color: 0xffffff,
                    title: song.titles.full,
                    url: song.url,
                    author: {
                        name: song.artist.name,
                        icon_url: song.artist.thumbnail,
                        url: song.artist.url,
                    },
                    thumbnail: {
                        url: song.raw.song_art_image_thumbnail_url,
                    },
                    fields: [
                        { "name": "Lyrics", "value": lyrics.slice(0, 1024 - lyricsEnd.length) + lyricsEnd }
                    ]
                }
            });
        })
        .catch(err => console.error(err));
}

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