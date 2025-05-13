import { Socket } from 'socket.io-client';
import { generateSecurity, verifyAccount } from '../components/SyasymAuth';

function xhrApi(method: string, url: string, json: {}, callback: (data: any) => void){
    const xhr = new XMLHttpRequest();
    if(method == 'POST'){
        xhr.open('POST', url, true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.onload = () => {
            const data = JSON.parse(xhr.responseText);
            callback(data)
        };
        const data = JSON.stringify(json);
        xhr.send(data);
    }
    else{
        xhr.open('GET', url, true);
        xhr.onload = () => {
            const data = JSON.parse(xhr.responseText);
            callback(data);
        };
        xhr.send();
    }
}

export class Authentication{

    socket: Socket
    element: Phaser.GameObjects.DOMElement
    changeAction: Element | null
    submit: Element | null

    constructor(scene: Phaser.Scene, socket: Socket){
        this.socket = socket

        this.element = scene.add.dom(scene.scale.width/2, scene.scale.height/2).createFromCache('loginform').setName('loginform')
        this.element.setScale(2)
        this.element.setVisible(false)

        let submit = this.element.getChildByID('submit')
        let changeAction = this.element.getChildByID('change-action')

        if(changeAction) changeAction.addEventListener('pointerdown', () => this.onChange())
        if(submit) submit.addEventListener('pointerdown', () => this.onSubmit(true))
    }

    onChange(){
        const name = this.element.name == 'loginform' ? 'registerform' : 'loginform'
        this.element.createFromCache(name)
        this.element.setName(name)

        this.changeAction = this.element.getChildByID('change-action')
        this.submit = this.element.getChildByID('submit')

        if(this.changeAction) this.changeAction.addEventListener('pointerdown', () => this.onChange())
        if(this.submit) this.submit.addEventListener('pointerdown', () => this.onSubmit(name == 'loginform'))
    }

    onSubmit(isLogin: boolean){
        if(isLogin){
            const username = (this.element.getChildByID('username') as HTMLInputElement).value
            const password = (this.element.getChildByID('password') as HTMLInputElement).value
            const isTrust = (this.element.getChildByID('trust') as HTMLInputElement).checked
            
            if(username.length < 1) return alert('username cannot be empty')
            if(password.length < 9) return alert('password must be at least 9 characters')

            this.login(username, password, isTrust)
        }
        else{
            const username = (this.element.getChildByID('username') as HTMLInputElement).value
            const password = (this.element.getChildByID('password') as HTMLInputElement).value
            const confirmPassword = (this.element.getChildByID('confirm-password') as HTMLInputElement).value

            if(username.length < 1) return alert('username cannot be empty')
            if(password.length < 9) return alert('password must be at least 9 characters')
            if(password !== confirmPassword) return alert('passwords do not match')

            this.register(username, password)
        }
        console.log('submit')
    }

    login(username: string, password: string, isTrust: boolean){
        xhrApi('GET', 'http://localhost:3000/get-akey?username='+username, {}, (data: { akey?: string, message?: string }) => {
            if(data.akey){
                const decrypted = verifyAccount(data.akey, username, this.socket.id, password, isTrust)

                if(!decrypted) return alert('invalid password')
                    
                xhrApi('POST', 'http://localhost:3000/login', decrypted, (data: { message: string }) => {
                    if(data.message == 'User logged in successfully!'){
                        localStorage.setItem('username', username)
                        this.element.setVisible(false)
                    }
                    else{
                        alert(data.message)
                    }
                })
            }
            else{
                alert(data.message)
                this.element.setVisible(true)
                localStorage.removeItem('username')
            }
        })
    }

    register(username: string, password: string){
            const akey = generateSecurity(username, password)
            xhrApi('POST', 'http://localhost:3000/register', akey, (data: { message: string }) => {
                alert(data.message)
                if(data.message == 'User registered successfully!') this.onChange()
            })
        }
}