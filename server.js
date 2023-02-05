require("dotenv").config()
const express = require('express')
const app = express()
const server = require('http').createServer(app)
const {Server} = require('socket.io')
const io = new Server(server)
const {google} = require('googleapis')
const locale = require("locale")
const path = require('path')
const supportedLanguages = require('./data/supportedLanguages.json')
const supportedLocales = new locale.Locales(supportedLanguages)
const webpack = require('webpack')
const webpackDevMiddleware = require('webpack-dev-middleware')
const Fifo = require('./Fifo')

const config = require('./webpack.config.js');
const compiler = webpack(config);

const auth = new google.auth.GoogleAuth({
    keyFile: './data/google-key.json',
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
})

google.options({
    auth: auth
})

const translate = google.translate({
    version: 'v2',
    auth,
})

function isBlank(str) {
    return (!str || /^\s*$/.test(str));
}

async function detectLanguage(text) {
    const res = await translate.detections.detect({
        requestBody: {
            q: text
        }
    })

    return res.data.data.detections[0][0].language
}

async function translateText(text, targetLanguage = 'en') {
    targetLanguage = targetLanguage.split('-')[0]

    const translation = await translate.translations.translate({
        requestBody: {
            target: targetLanguage,
            q: text
        }
    })

    return {
        translated: translation.data.data.translations[0].translatedText,
        original: text,
        fromLanguage: translation.data.data.translations[0].detectedSourceLanguage,
        targetLanguage: targetLanguage,
    }
}

app.use(webpackDevMiddleware(compiler, {
    publicPath: config.output.publicPath,
}))
app.use(express.static(path.resolve('./public')))
app.use(express.static(path.resolve('./dist')))

// app.get('/', function (req, res) {
//     res.sendFile(`${__dirname }/index.html`)
// })

const connectedUsers = new Map();
const eventHistory = new Fifo(50, undefined, './data/eventHistory.json')

function updateUsers() {
    io.emit('users', {users: [...connectedUsers.values()]})
}

io.on('connection', function (socket) {
    const languages = new locale.Locales(socket.handshake.headers['accept-language'])
    const bestLanguage = languages.best(supportedLocales)

    connectedUsers.set(socket, {
        username: 'anonymous',
        connectionTime: Date.now(),
        language: bestLanguage.language,
    })

    socket.on('chat message', async (message) => {
        const userData = connectedUsers.get(socket)
        if (userData.username === undefined) {
            socket.emit('error', 'You can\'t chat without a username!')
            return
        }

        if (isBlank(message)) {
            return
        }

        message = message.trim()

        console.log('chat message', {
            message,
            user: userData.username
        })

        const translationCache = new Map()
        const timestamp = Date.now()

        for (const _connectedUser of connectedUsers) {
            if (_connectedUser[0] === socket) continue
            const connectedUser = _connectedUser[1]
            const targetLanguage = connectedUser.language

            let translation = undefined
            if (translationCache.has(targetLanguage)) {
                translation = translationCache.get(targetLanguage)
            } else {
                translation = await translateText(message, targetLanguage)
                translationCache.set(targetLanguage, translation)
            }

            const messageObject = {
                fromUser: connectedUsers.get(socket).username,
                content: translation.translated,
                original: message,
                fromLanguage: translation.fromLanguage,
                timestamp,
            }

            _connectedUser[0].emit('chat message', messageObject)
        }

        eventHistory.push({
            type: 'chat message',
            data: {
                translationCache: Object.fromEntries(translationCache),
                fromUser: connectedUsers.get(socket).username,
                original: message,
            },
            timestamp
        })
    })

    socket.on('register', (_userData) => {
        const userData = connectedUsers.get(socket)
        if (_userData.username && _userData.username.length > 0) {
            const timestamp = Date.now()
            userData.username = _userData.username
            io.emit('user connect', {
                username: _userData.username
            })
            eventHistory.push({
                type: 'user connect',
                data: {
                    username: _userData.username,
                },
                timestamp,
            })
        }

        console.log('user connected: ' + userData.username)

        socket.emit('languages', {
            supportedLanguages,
            activeLanguage: userData.language
        })

        updateUsers()
    })

    socket.on('change language', (newLanguage) => {
        const userData = connectedUsers.get(socket)
        userData.language = newLanguage
        console.log(userData)
        console.log(connectedUsers.get(socket))
    })

    socket.on('get history', () => {
        socket.emit('history', {
            history: eventHistory.array
        })
    })

    socket.on('disconnect', function () {
        console.log('user disconnected')
        const userData = connectedUsers.get(socket)
        io.emit('user disconnect', {
            username: userData.username
        })
        eventHistory.push({
            type: 'user disconnect',
            data: {
                username: userData.username,
            },
        })

        connectedUsers.delete(socket)
        updateUsers()
    })
})

server.listen(process.env.PORT, function () {
    console.log(`listening on *:${process.env.PORT}`)
})