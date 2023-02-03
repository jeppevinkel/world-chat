export class MessageBuilder {
    class = 'message'

    constructor(document) {
        this.document = document
    }

    setText(text) {
        this.text = text
        return this
    }

    setLanguage(language) {
        this.language = language
        return this
    }

    setTime(timeStr) {
        this.timeStr = timeStr
        return this
    }

    setTypeInfo() {
        this.class = 'message info'
        return this
    }

    setTypeMe() {
        this.class = 'message me'
        return this
    }

    setTypeDefault() {
        this.class = 'message'
        return this
    }

    isSpacer(value = true) {
        this.spacer = value
        return this
    }

    setTitle(text) {
        this.title = text
        return this
    }

    setFrom(name) {
        this.from = name
        return this
    }

    build() {
        const messageDiv = document.createElement('div')
        if (this.spacer) {
            messageDiv.setAttribute('class', 'message hr')
            return messageDiv
        }

        messageDiv.setAttribute('class', this.class)

        const timeSpan = document.createElement('span')
        timeSpan.setAttribute('class', 'time')
        timeSpan.innerHTML = this.timeStr ?? ''

        const fromSpan = document.createElement('span')
        fromSpan.setAttribute('class', 'from')
        let from = this.from ?? ''
        if (this.language && this.language.length > 0) from = `[${this.language}] ` + from
        fromSpan.innerHTML = from

        const textSpan = document.createElement('span')
        textSpan.setAttribute('class', 'text')
        textSpan.innerHTML = this.text ?? ''
        textSpan.title = this.title ?? ''

        messageDiv.append(timeSpan, fromSpan, textSpan)
        return messageDiv
    }
}