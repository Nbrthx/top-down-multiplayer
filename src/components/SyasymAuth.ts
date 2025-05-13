import { ec as EC } from 'elliptic'
import sha256 from 'sha256'
import aesjs from 'aes-js'

const ec = new EC('secp256k1');
const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

// Encrypt
// 
// 

const generateSalt = (password: string) => {
    let text = "";
    const random = crypto.getRandomValues(new Uint8Array(4)).map(v => v/10);
  
    for (let i = 0; i < 4; i++){
      text += possible.charAt(random[i]);
    }
  
    return aesjs.utils.hex.toBytes(sha256(password+text));
}

export function generateSecurity(username: string, password: string) {
    const key = ec.genKeyPair();
    const privKey = key.getPrivate('hex');
    const pubKey = key.getPublic('hex');

    const salt = generateSalt(password);

    const privKeyBytes = aesjs.utils.utf8.toBytes(privKey);
        
    const aesCtr = new aesjs.ModeOfOperation.ctr(salt, new aesjs.Counter(5));
    const encryptedBytes = aesCtr.encrypt(privKeyBytes);

    const encryptedPrivKey = aesjs.utils.hex.fromBytes(encryptedBytes);
    
    return {
        akey: encryptedPrivKey,
        pubKey: pubKey,
        username: username
    }
}

export function generateSecurityWithSalt(username: string, salt: Uint8Array) {
    const key = ec.genKeyPair();
    const privKey = key.getPrivate('hex');
    const pubKey = key.getPublic('hex');

    const privKeyBytes = aesjs.utils.utf8.toBytes(privKey);
        
    const aesCtr = new aesjs.ModeOfOperation.ctr(salt, new aesjs.Counter(5));
    const encryptedBytes = aesCtr.encrypt(privKeyBytes);

    const encryptedPrivKey = aesjs.utils.hex.fromBytes(encryptedBytes);
    
    return {
        akey: encryptedPrivKey,
        pubKey: pubKey,
        username: username
    }
}

// Decrypt
// 
// 

const guessSalt = (password: string, nonce: number) => {
    if(nonce >= possible.length**4) return null;

    let guess = [0,0,0,0];
    let text = ''

    for (let i = 0; i < 4; i++) {
        guess[i] = nonce % possible.length;
        nonce = Math.floor(nonce / possible.length);
    }
    for (let i = 0; i < 4; i++) {
        text += possible.charAt(guess[i])
    }
    
    return aesjs.utils.hex.toBytes(sha256(password+text))
}

function isHexadecimal(text: string) {
  return /^#?[0-9A-Fa-f]+$/.test(text);
}

export function verifyAccount(akey: string, username: string, message = '', password?: string, isTrust?: boolean) {
    let counter = 0

    const encryptedBytes = aesjs.utils.hex.toBytes(akey);
    let decryptedText: string = ''
    
    if(password) clearSalt()
    let salt = getSalt()

    if(salt){
        const aesCtr = new aesjs.ModeOfOperation.ctr(salt, new aesjs.Counter(5));

        const decryptedBytes = aesCtr.decrypt(encryptedBytes);
        decryptedText = aesjs.utils.utf8.fromBytes(decryptedBytes);
    }
    else{
        while(!isHexadecimal(decryptedText)){
            salt = guessSalt(password || '', counter);

            if(!salt) return null;

            const aesCtr = new aesjs.ModeOfOperation.ctr(salt, new aesjs.Counter(5));

            const decryptedBytes = aesCtr.decrypt(encryptedBytes);
            decryptedText = aesjs.utils.utf8.fromBytes(decryptedBytes);

            counter++
        }
    }
    
    if(!salt || !isHexadecimal(decryptedText)) return null;
    
    if(isTrust && salt) setSalt(aesjs.utils.hex.fromBytes(salt))

    const key = ec.keyFromPrivate(decryptedText);
    const newAkey = generateSecurityWithSalt(username, salt)
    
    const signature = key.sign(akey+newAkey.akey+newAkey.pubKey+username+message).toDER('hex');

    return {
        username: username,
        signature: signature,
        newAkey: newAkey.akey,
        newPubKey: newAkey.pubKey,
        message: message
    }
}

export function clearSalt(){
    localStorage.removeItem('salt')
}

export function getSalt(){
    const salt = localStorage.getItem('salt')
    
    if(!salt) return null;
    return aesjs.utils.hex.toBytes(salt)
}

export function setSalt(salt: string){
    localStorage.setItem('salt', salt)
}