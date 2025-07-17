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

const htmlAlert = (message: string | null | undefined) => {
    const warning = document.getElementById('warn')
    if(warning) warning.innerHTML = message || ''
}

export class Authentication extends Phaser.GameObjects.DOMElement {

    socket: Socket
    changeAction: Element | null
    submit: HTMLButtonElement | null
    isLoading: boolean = false

    constructor(scene: Phaser.Scene){
        super(scene, scene.scale.width/2, scene.scale.height/2)

        scene.add.existing(this)

        this.createFromCache('loginform').setName('loginform')
        this.setScale(2)
        this.setVisible(false)

        const submit = this.getChildByID('submit')
        const changeAction = this.getChildByID('change-action')

        if(changeAction) changeAction.addEventListener('pointerdown', () => this.onChange())
        if(submit){
            submit.addEventListener('pointerdown', () => this.onSubmit(true))
            this.submit = submit as HTMLButtonElement
        }
    }

    onChange(){
        const name = this.name == 'loginform' ? 'registerform' : 'loginform'
        this.createFromCache(name)
        this.setName(name)

        this.changeAction = this.getChildByID('change-action')

        if(this.changeAction) this.changeAction.addEventListener('pointerdown', () => this.onChange())
        if(this.submit) this.submit.addEventListener('pointerdown', () => this.onSubmit(name == 'loginform'))
    }

    onSubmit(isLogin: boolean){
        if(this.isLoading) return

        if(isLogin){
            const username = this.getChildByID('username') as HTMLInputElement
            const password = this.getChildByID('password') as HTMLInputElement
            const isTrust = this.getChildByID('trust') as HTMLInputElement

            username.onfocus = () => htmlAlert('')
            password.onfocus = () => htmlAlert('')
            isTrust.onfocus = () => htmlAlert('')
            
            if(username.value.length < 1) return htmlAlert('username cannot be empty')
            else if(username.value.includes(':')) return htmlAlert('username cannot contain "-"')
            else if(password.value.length < 9) return htmlAlert('password must be at least 9 characters')

            this.isLoading = true
            if(this.submit) this.submit.innerHTML = 'L O A D I N G . . .'
            setTimeout(() => this.login(username.value, password.value, isTrust.checked), 50)
        }
        else{
            const username = this.getChildByID('username') as HTMLInputElement
            const password = this.getChildByID('password') as HTMLInputElement
            const confirmPassword = this.getChildByID('confirm-password') as HTMLInputElement

            username.onfocus = () => htmlAlert('')
            password.onfocus = () => htmlAlert('')
            confirmPassword.onfocus = () => htmlAlert('')

            if(username.value.length < 1) return htmlAlert('username cannot be empty')
            else if(password.value.length < 9) return htmlAlert('password must be at least 9 characters')
            else if(password.value !== confirmPassword.value) return htmlAlert('passwords do not match')

            this.isLoading = true
            if(this.submit) this.submit.innerHTML = 'L O A D I N G . . .'
            setTimeout(() => this.register(username.value, password.value), 50)
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

                    if(!decrypted){
                        this.socket.disconnect()

                        this.isLoading = false
                        if(this.submit) this.submit.innerHTML = 'Login'
                        htmlAlert('invalid password')
                        return
                    }
                        
                    xhrApi('POST', HOST_ADDRESS+'/login', decrypted, (data: { message: string }) => {
                        if(data.message == 'User logged in successfully!'){
                            localStorage.setItem('username', username)
                            if(this.scene) this.scene.registry.set('socket', this.socket)
                            this.setVisible(false)

                            this.isLoading = false
                            if(this.submit) this.submit.innerHTML = 'Login'
                        }
                        else{
                            htmlAlert(data.message)
                            localStorage.removeItem('username')
                            localStorage.removeItem('salt')
                            this.socket.disconnect()

                            this.isLoading = false
                            if(this.submit) this.submit.innerHTML = 'Login'
                        }
                    })
                }
                else{
                    htmlAlert(data.message)
                    this.setVisible(true)
                    localStorage.removeItem('username')
                    localStorage.removeItem('salt')
                    this.socket.disconnect()

                    this.isLoading = false
                    if(this.submit) this.submit.innerHTML = 'Login'
                }
            })
        })
    }

    register(username: string, password: string){
        const akey = generateSecurity(username, password)
        xhrApi('POST', HOST_ADDRESS+'/register', akey, (data: { message: string }) => {
            htmlAlert(data.message)
            if(data.message == 'User registered successfully!') this.onChange()

            this.isLoading = false
            if(this.submit) this.submit.innerHTML = 'Register'
        })
    }
}