import { createServer } from 'http'
import * as express from "express"

import { SocketManager } from './SocketManager'

const app = express()
const httpServer = createServer(app)
var htmlPath = __dirname+'/dist';
app.use(express.static(htmlPath));

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

new SocketManager(httpServer)

httpServer.listen(3000, () => {
    console.log('listening on *:3000')
})