import { Server } from 'socket.io'
import { createServer } from 'http'
import * as express from "express"

const app = express()
const httpServer = createServer(app)
var htmlPath = __dirname+'/dist';
app.use(express.static(htmlPath));

const io = new Server(httpServer)

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

httpServer.listen(3000, () => {
    console.log('listening on *:3000')
})