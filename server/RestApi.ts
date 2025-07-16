import { ec as EC } from 'elliptic'
import * as express from 'express';
import { Account } from './server';
import { male, female } from './json/outfit-list.json';
import { _npcList } from './json/npc-list.json';
import { _itemList } from './json/item-list.json';
import { _enemyList } from './json/enemy-list.json';

const ec = new EC('secp256k1');

export class RestApi{

    accounts: Account[]
    authedId: Map<string, string>

    constructor(app: express.Application, accounts: Account[], authedId: Map<string, string>){
        this.accounts = accounts
        this.authedId = authedId

        app.get('/outfit-list', (_req, res) => {
            res.json({ male, female });
        });

        app.get('/npc-list', (_req, res) => {
            res.json(_npcList);
        });

        app.get('/item-list', (_req, res) => {
            res.json(_itemList);
        });

        app.get('/enemy-list', (_req, res) => {
            res.json(_enemyList);
        });

        app.post("/register", (req, res) => this.register(req, res));

        app.get("/get-akey", (req, res) => this.getAkey(req, res))

        app.post("/login", (req, res) => this.login(req, res))
    }

    register(req: express.Request, res: express.Response){
        const { akey, pubKey, username } = req.body;

        if(username.includes('-')) res.status(409).json({ message: "Username cannot contain '-'" })
        else if(this.accounts.find(u => u.username === username)){
            res.status(409).json({ message: "Username already exists!" })
        }
        else{
            this.accounts.push({
                username: username as string,
                pubKey: pubKey as string,
                akey: akey as string,
                xp: 0,
                health: 100,
                outfit: {
                    isMale: false,
                    color: 0x999999,
                    hair: "basic",
                    face: "basic",
                    body: "basic",
                    leg: "basic"
                },
                inventory: [],
                questCompleted: []
            });

            console.log("User registered: "+username)
            res.json({ message: "User registered successfully!" });
        }
    }

    getAkey(req: express.Request, res: express.Response){
        const { username } = req.query;

        const user = this.accounts.find(u => u.username === username) || null;

        if(user){
            console.log('User get akey: '+username)
            res.json({ akey: user.akey });
        }
        else{
            res.status(404).json({ message: "User not found!" });
        }
    }

    login(req: express.Request, res: express.Response){
        const { username, signature, newAkey, newPubKey, message } = req.body;

        const user = this.accounts.find(v => v.username === username);

        if(!user) res.status(404).json({ message: "User not found!" });
        else{
            const key = ec.keyFromPublic(user.pubKey, 'hex');
            const isValid = key.verify(user.akey+newAkey+newPubKey+user.username+message, signature);
            
            if(!isValid) res.status(401).json({ message: "Invalid signature!" });
            else{
                user.akey = newAkey;
                user.pubKey = newPubKey;

                this.authedId.set(message, username)

                console.log("User logged in: "+username)
                res.json({ message: "User logged in successfully!" });
            }
        }
    }
}