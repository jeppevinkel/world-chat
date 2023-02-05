const fs = require('fs').promises

class Fifo {
    constructor(size, defaultArray = [], backupPath = undefined) {
        if (!defaultArray)
            defaultArray = []

        this.array = defaultArray
        this.size = size

        this.backupPath = backupPath
        this.loaded = false

        this.load()
        this.truncate()
    }

    push(element) {
        this.array.push(element)
        this.truncate()
        return this.array.length
    }

    pop() {
        this.length = this.array.length-1
        const el = this.array.shift()
        this.save()
        return el
    }

    truncate() {
        while (this.array.length > this.size)
            this.array.shift()
        this.length = this.array.length
        this.save()
    }

    async save() {
        if (!this.backupPath || !this.loaded) return
        await fs.writeFile(this.backupPath, JSON.stringify(this.array), {encoding: 'utf-8'})
    }

    async load() {
        if (!this.backupPath) {
            this.loaded = true
            return false
        }
        try {
            const json = await fs.readFile(this.backupPath, {encoding: 'utf-8'})
            this.array = JSON.parse(json)
            this.loaded = true
            this.truncate()
            return true
        } catch (e) {
            this.loaded = true
            return false
        }
    }
}

module.exports = Fifo