import './scss/chat.scss'
import {run} from './app/app'
import {ChatService} from './app/chat.service'
import {io} from 'socket.io-client'

const socket = io();
const chatService = new ChatService(socket, {
    username: prompt("what's your nickname?")
})

run(chatService)