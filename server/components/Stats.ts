import { Account } from "../server"

export class Stats{

    account: Account
    private xp: number

    constructor(account: Account){
        this.account = account
        this.xp = account.xp || 0
    }
       
    getLevel(){
        let level = Math.floor((Math.sqrt(8 * Math.sqrt(this.xp) + 1) - 1) / 2)+1
        return Math.min(level, 99)
    }

    getNextXp(){
        if(this.getLevel() == 99) return 0
        return (this.getLevel())**3
    }

    getXp(){
        return Math.max(this.xp - Math.pow((this.getLevel())*(this.getLevel()-1)/2, 2), 0)
    }

    getRealXp(){
        return this.xp + 0
    }

    addXp(xp: number){
        this.xp += xp
        this.account.xp = this.xp
    }

    removeXp(xp: number){
        this.xp -= xp
        this.account.xp = this.xp
    }
}