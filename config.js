const fs = require("fs")

let cachedConfig
let lastCache = 0

/**
 * Get the most recently cached config
 */
exports.getConfig = () => {
    if (Date.now() - lastCache > 10000) {
        cachedConfig = JSON.parse(fs.readFileSync("config.json"))
        lastCache = Date.now()
    }

    return cachedConfig
}

/**
 * Set a value in the config
 * @param {string} path The path to the json field
 * @param {any} value The new value of the field
 */
exports.set = (path, value) => {
    const keys = path.split(".")
    let val = keys.reduce((o, n) => {
        if (n === keys[keys.length - 1])
            o[n] = value

        return o[n]
    }, this.getConfig())
    fs.writeFileSync("config.json", JSON.stringify(cachedConfig, null, 4))
}

/**
 * Get a value from the config
 * @param {string} path The path to the json field
 */
exports.get = (path) => {
    return path.split(".").reduce((o, n) => o[n], this.getConfig())
}