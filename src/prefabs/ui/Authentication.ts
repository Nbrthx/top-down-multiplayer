import { io, Socket } from 'socket.io-client';
import { generateSecurity, verifyAccount } from '../../components/SyasymAuth';
import { HOST_ADDRESS } from '../../scenes/MainMenu';

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

export class Authentication extends Phaser.GameObjects.DOMElement {

    socket: Socket
    changeAction: Element | null
    submit: Element | null
    isLoading: boolean = false

    constructor(scene: Phaser.Scene){
        super(scene, scene.scale.width/2, scene.scale.height/2)

        scene.add.existing(this)

        this.createFromCache('loginform').setName('loginform')
        this.setScale(2)
        this.setVisible(false)

        let submit = this.getChildByID('submit')
        let changeAction = this.getChildByID('change-action')

        if(changeAction) changeAction.addEventListener('pointerdown', () => this.onChange())
        if(submit) submit.addEventListener('pointerdown', () => this.onSubmit(true))
    }

    onChange(){
        const name = this.name == 'loginform' ? 'registerform' : 'loginform'
        this.createFromCache(name)
        this.setName(name)

        this.changeAction = this.getChildByID('change-action')
        this.submit = this.getChildByID('submit')

        if(this.changeAction) this.changeAction.addEventListener('pointerdown', () => this.onChange())
        if(this.submit) this.submit.addEventListener('pointerdown', () => this.onSubmit(name == 'loginform'))
    }

    onSubmit(isLogin: boolean){
        if(this.isLoading) return
        this.isLoading = true

        if(isLogin){
            const username = (this.getChildByID('username') as HTMLInputElement).value
            const password = (this.getChildByID('password') as HTMLInputElement).value
            const isTrust = (this.getChildByID('trust') as HTMLInputElement).checked
            
            if(username.length < 1) return alert('username cannot be empty')
            if(password.length < 9) return alert('password must be at least 9 characters')

            this.login(username, password, isTrust)
        }
        else{
            const username = (this.getChildByID('username') as HTMLInputElement).value
            const password = (this.getChildByID('password') as HTMLInputElement).value
            const confirmPassword = (this.getChildByID('confirm-password') as HTMLInputElement).value

            if(username.length < 1) return alert('username cannot be empty')
            if(password.length < 9) return alert('password must be at least 9 characters')
            if(password !== confirmPassword) return alert('passwords do not match')

            this.register(username, password)
        }
        console.log('submit')
    }

    login(username: string, password: string, isTrust: boolean){
        this.socket = io(HOST_ADDRESS, {
            transports: ['websocket']
        })
        this.socket.on('connect', () => {
            xhrApi('GET', HOST_ADDRESS+'/get-akey?username='+username, {}, (data: { akey?: string, message?: string }) => {
                if(data.akey){
                    const decrypted = verifyAccount(data.akey, username, this.socket.id, password, isTrust)

                    if(!decrypted) return alert('invalid password')
                        
                    xhrApi('POST', HOST_ADDRESS+'/login', decrypted, (data: { message: string }) => {
                        if(data.message == 'User logged in successfully!'){
                            localStorage.setItem('username', username)
                            if(this.scene) this.scene.registry.set('socket', this.socket)
                            this.setVisible(false)
                        }
                        else{
                            alert(data.message)
                            localStorage.removeItem('username')
                            localStorage.removeItem('salt')
                            this.isLoading = false
                            this.socket.disconnect
                        }
                    })
                }
                else{
                    alert(data.message)
                    this.setVisible(true)
                    localStorage.removeItem('username')
                    localStorage.removeItem('salt')
                    this.isLoading = false
                    this.socket.disconnect
                }
            })
        })
    }

    register(username: string, password: string){
        const akey = generateSecurity(username, password)
        xhrApi('POST', HOST_ADDRESS+'/register', akey, (data: { message: string }) => {
            alert(data.message)
            if(data.message == 'User registered successfully!') this.onChange()
            this.isLoading = false
        })
    }
}