const { registerFont, createCanvas, loadImage } = require('canvas')
const utils = require('../utils.js')
const constants = require('../constants.js')

// Initialize the canvas
registerFont("/home/dustin/discord/etc/Gobold-Bold.ttf", { family: "Custom" })
const canvas = createCanvas(800, 569)
const ctx = canvas.getContext('2d')

// Map of image paths to their Image() object
const images = {
    "/home/dustin/discord/img/map.png": {},
    "/home/dustin/discord/img/top.png": {},
    "/home/dustin/discord/img/mid.png": {},
    "/home/dustin/discord/img/bot.png": {},
    "/home/dustin/discord/img/support.png": {},
    "/home/dustin/discord/img/jungle.png": {}
}

// Pre-load all images
for (const key of Object.keys(images)) {
    loadImage(key).then((image) => {
        images[key] = image
    })
}

// Define the locations of the roles on the map image
const layout = [
    { x: 255, y: 80, rotation: 0 },      // Top
    { x: 375, y: 320, rotation: -43 },   // Middle
    { x: 555, y: 455, rotation: 0 },     // Bottom
    { x: 555, y: 510, rotation: 0 },     // Support
    { x: 200, y: 220, rotation: 0 }      // Jungle
]

/**
 * Generate an image displaying user roles on the League map
 * @param {Array} assignments A role assignment array (e.g [Top, Middle, Bottom, Support, Jungle])
 */
function createRolesImage(assignments) {
    ctx.drawImage(images["/home/dustin/discord/img/map.png"], 0, 0)

    ctx.font = `30px "Custom"`

    for (let i = 0; i < assignments.length; i++) {
        const name = assignments[i]
        const loc = layout[i]
        if (!name) continue

        const width = ctx.measureText(name).width

        // Rotate the canvas by the given degrees
        ctx.save()
        ctx.translate(loc.x, loc.y)
        ctx.rotate(loc.rotation * (Math.PI / 180))

        // Draw background rectangle
        ctx.fillStyle = "rgba(0,0,0,0.5)"
        ctx.beginPath()
        ctx.rect(-65, -37, width + 75, 50)
        ctx.fill()

        // Draw role icon
        ctx.drawImage(images[Object.keys(images)[i + 1]], -60, -38, 50, 50)

        // Draw username text
        ctx.fillStyle = "rgba(255,255,255,1)"
        ctx.fillText(name, 0, 0)

        // Undo all rotations
        ctx.restore()
    }

    return canvas.toBuffer("image/png")
}

module.exports = (msg) => {
    let users = utils.getChatUsers()
    //let users = [{ username: "Lemons", id: "123" }, { username: "xamfear", id: "123" }, { username: "dustin-craig", id: "123" }, { username: "DanielL543", id: "123" }, { username: "jj2341", id: "123" }, { username: "bobby", id: "123" }]

    // Make sure there's people in chat
    if (users.length === 0) {
        msg.reply(`There's no one to choose from???`)
        return
    }

    // Dwindling array of indices from [0, 4]
    let indices = [...Array(5).keys()]

    // The role assignments where [0] is top, [1] is middle, [2] is bottom, [3] is support, [4] is jungle
    let assignments = []

    for (const user of users) {
        if (indices.length === 0) break

        // Find a random role index
        const idx = Math.floor(Math.random() * indices.length)
        const role_idx = indices[idx]

        // Assign the role to the user
        assignments[role_idx] = user.username.toLowerCase()

        // Remove the role index
        indices.splice(idx, 1)
    }

    msg.channel.send("", { files: [createRolesImage(assignments)] })
}