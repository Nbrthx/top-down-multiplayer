import { createServer } from 'http'
import * as express from "express"
import * as cors from 'cors'
import * as bodyParser from 'body-parser'

import { SocketManager } from './SocketManager'
import { RestApi } from './RestApi'

const app = express()
const httpServer = createServer(app)
var htmlPath = __dirname+'/dist';

app.use(express.static(htmlPath));
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

const accounts: {
    username: string,
    pubKey: string,
    akey: string,
    xp: number,
    inventory: {
        id: string
        name: string
    }[]
}[] = []

const authedId: Map<string, string> = new Map() // socket.id | username

new RestApi(app, accounts, authedId)

new SocketManager(httpServer, accounts, authedId)

httpServer.listen(3000, () => {
    console.log('listening on *:3000')
})