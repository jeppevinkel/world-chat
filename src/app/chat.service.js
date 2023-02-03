import * as $ from 'jquery'
import {MessageBuilder} from './utils/message-builder'
import moment from 'moment'

export class ChatService {
    constructor(socket, options) {
        this.socket = socket
        // const languageForm = document.getElementById('language-form')
        // const languageSelect = document.getElementById('language-select')

        this.username = options?.username?.length > 0 ? options.username : 'anon'

        this.messages = document.getElementById('messages')
        this.messageContainer = document.getElementById('message-container')
        this.messageForm = document.getElementById('message-form')
        this.messageInput = document.getElementById('message-input')
        this.userList = document.getElementById('user-list')
    }

    init() {
        const joinTimeInfoDiv = new MessageBuilder(document)
            .setTypeInfo()
            .setText(`Messages since ${moment().format('MMMM Do YYYY, h:mm:ss a')}`)
            .build()
        this.messages.appendChild(joinTimeInfoDiv)


        this.messageForm.addEventListener('submit', (e) => {
            e.preventDefault()
            if (this.messageInput.value) {
                const message = this.messageInput.value.trim()
                if (message.length === 0) return
                this.messageInput.value = ''

                const messageDiv = new MessageBuilder(document)
                    .setFrom(this.username)
                    .setText(message)
                    .setTypeMe()
                    .setTime(`[${moment().format('DD.MM.YYYY HH:mm:ss')}]`)
                    .build()

                this.messages.appendChild(messageDiv)
                this.messageContainer.scrollTop = this.messageContainer.scrollHeight

                this.socket.emit('chat message', message)
            }
        });

        this.messageForm.addEventListener('keydown', (e) => {
            if (e.ctrlKey && (e.keyCode === 13 || e.code === 'Enter' || e.code === 'NumpadEnter')) {
                this.messageForm.requestSubmit()
            }
        })

        // languageForm.addEventListener('submit', (e) => {
        //     e.preventDefault();
        //     this.socket.emit('change language', languageSelect.value);
        // })

        this.subscribeEvents()
    }

    subscribeEvents() {
        this.socket.on('chat message', (message) => {
            const messageDiv = new MessageBuilder(document)
                .setFrom(message.fromUser)
                .setText(message.content)
                .setTitle(message.original)
                .setLanguage(message.fromLanguage)
                .setTime(`[${moment().format('DD.MM.YYYY HH:mm:ss')}]`)
                .build()

            this.messages.appendChild(messageDiv)
            this.messageContainer.scrollTop = this.messageContainer.scrollHeight
        })

        this.socket.on('users', ({users}) => {
            this.userList.innerHTML = ''

            users.sort((a, b) => a.connectionTime < b.connectionTime)

            for (const user of users) {
                const li = document.createElement('li')
                li.textContent = user.username
                this.userList.appendChild(li)
            }
        })

        this.socket.on('error', (error) => {
            alert(error)
        })

        this.socket.on('connect', () => {
            this.socket.emit('register', {
                username: this.username,
            })
        })

        this.socket.on('user disconnect', ({username}) => {
            const userDisconnectDiv = new MessageBuilder(document)
                .setTypeInfo()
                .setText(`${username} has disconnected`)
                .build()
            this.messages.appendChild(userDisconnectDiv)
        })

        // this.socket.on('languages', ({supportedLanguages, activeLanguage}) => {
        //     for (const language of supportedLanguages) {
        //         console.log(language)
        //         const el = document.createElement('option')
        //
        //         el.value = language
        //         el.textContent = language
        //
        //         if (language === activeLanguage) el.selected = true
        //
        //         languageSelect.appendChild(el)
        //     }
        // })
    }
}