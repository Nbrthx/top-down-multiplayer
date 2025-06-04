export class Stats{

    xp: number

    constructor(xp?: number){
        this.xp = xp || 0
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

    setTotalXp(xp: number){
        this.xp = xp
    }
}