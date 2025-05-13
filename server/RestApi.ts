import { ec as EC } from 'elliptic'
import * as express from 'express';

const ec = new EC('secp256k1');

interface Accounts{
    username: string,
    pubKey: string,
    akey: string,
    xp: number,
    inventory: {
        id: string
        name: string
    }[]
}

export class RestApi{

    accounts: Accounts[]
    authedId: Map<string, string>

    constructor(app: express.Application, accounts: Accounts[], authedId: Map<string, string>){
        this.accounts = accounts
        this.authedId = authedId

        app.post("/register", (req, res) => this.register(req, res));

        app.get("/get-akey", (req, res) => this.getAkey(req, res))

        app.post("/login", (req, res) => this.login(req, res))
    }

    register(req: express.Request, res: express.Response){
        const { akey, pubKey, username } = req.body;

        if(this.accounts.find(u => u.username === username)){
            res.status(409).json({ message: "Username already exists!" })
        }
        else{
            this.accounts.push({
                username: username as string,
                pubKey: pubKey as string,
                akey: akey as string,
                xp: 0,
                inventory: []
            });

            console.log("User registered: "+username, akey)
            res.json({ message: "User registered successfully!" });
        }
    }

    getAkey(req: express.Request, res: express.Response){
        const { username } = req.query;

        const user = this.accounts.find(u => u.username === username) || null;

        if(user){
            console.log('User get akey: '+username, user.akey)
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

                console.log("User logged in: "+username, user.akey)
                res.json({ message: "User logged in successfully!" });
            }
        }
    }
        
}