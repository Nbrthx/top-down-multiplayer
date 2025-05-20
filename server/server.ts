import { createServer } from 'http'
import * as express from "express"
import * as cors from 'cors'
import * as bodyParser from 'body-parser'

import { SocketManager } from './SocketManager'
import { RestApi } from './RestApi'

export interface Account{
    username: string,
    pubKey: string,
    akey: string,
    xp: number,
    inventory: { id: string; name: string }[]
}

const app = express()
const httpServer = createServer(app)
var htmlPath = __dirname+'/../dist';

app.use(express.static(htmlPath));
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

app.get('/', (_req, res) => res.sendFile(htmlPath+'/index.html'))

const accounts: Account[] = [
    {
        "username": "tada",
        "pubKey": "04629fc357fa69e3a16534aba075c288a528ca96abc9218e77618b9206e4caf71692ce8aa06ec1f2202945b0d755524011d8875d7ea39086e3b94bb8b71303c7ce",
        "akey": "cb82f45fbe63ae34b8d6b5d0ce29fccfe2c510ee55495a5699dd8f07fa206df718562d7293c1e53e90b9689087c3e09a4f1c886360bcb4f21c173fd99f488d6c",
        "xp": 0,
        "inventory": [
            {
                "id": "sword",
                "name": "Sword"
            }
        ]
    },
    {
        "username": "husen",
        "pubKey": "04cbba3ba6074fb1c970f0b01c42a443cba025a52a547145b9d974fa7e7f595f41de1d406614f5bd346253b1a47838138549bd2d7d55c22356cd51664041e94974",
        "akey": "6fd2f0798d96fc7ab4df873357c18f452c87bc608b4fd429c8851f439ea7fefe1974e718dd0411c76575fddd6dbf10644a8046321243589c2710fa3a47af14cf",
        "xp": 0,
        "inventory": [
            {
                "id": "sword",
                "name": "Sword"
            }
        ]
    }
]

const authedId: Map<string, string> = new Map() // socket.id | username

new RestApi(app, accounts, authedId)

new SocketManager(httpServer, accounts, authedId)

httpServer.listen(3000, () => {
    console.log('listening on *:3000')
})