import { Server, Socket } from 'socket.io';
import { GameManager } from './GameManager';
import { Server as HTTPServer } from 'http'

export class SocketManager {

    private io: Server;
    private gameManager: GameManager;

    constructor(server: HTTPServer) {
        this.io = new Server(server);
        this.gameManager = new GameManager(this.io);

        this.io.on('connection', this.setupSocketListeners.bind(this))
    }

    private setupSocketListeners(socket: Socket): void {

        console.log(`User connected: ${socket.id}`);

        socket.on('joinGame', worldId => {
            worldId;
            const world = this.gameManager.getWorld('world1')
            world?.addPlayer(socket.id);
            socket.emit('joinGame', world?.players.map(v => v.id))
            socket.broadcast.emit('playerJoined', socket.id);
        })

        socket.on('playerInput', (worldId: string, input: { dir: { x: number, y: number } }) => {
            this.gameManager.handleInput(socket.id, worldId, input);
        });

        socket.on('ping', (callback) => {
            callback()
        })

        socket.on('disconnect', () => {
            console.log(`User disconnected: ${socket.id}`);

            socket.broadcast.emit('playerLeft', socket.id);
            this.gameManager.getWorld('world1')?.removePlayer(socket.id);
        });
        
    }
}
