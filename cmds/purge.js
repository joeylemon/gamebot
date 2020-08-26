module.exports = (message) => {
    (async () => {
        await message.channel.fetchMessages({
            limit: 100
        }).then((msgCollection) => {
            msgCollection.forEach((msg) => {
                msg.delete();
            })
        });
    })()
}
