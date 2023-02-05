class Fifo {
    constructor(size, defaultArray = []) {
        if (!defaultArray)
            defaultArray = []

        this.array = defaultArray
        this.size = size

        this.truncate()
    }

    push(element) {
        this.array.push(element)
        this.truncate()
        return this.array.length
    }

    pop() {
        this.length = this.array.length-1
        return this.array.shift()
    }

    truncate() {
        while (this.array.length > this.size)
            this.array.shift()
        this.length = this.array.length
    }
}

module.exports = Fifo