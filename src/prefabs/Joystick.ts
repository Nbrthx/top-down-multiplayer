import Phaser from 'phaser';

export interface JoystickEventArgs {
    x: number;
    y: number;
    angle: number;
    distance: number;
}

export type JoystickEventHandler = (args: JoystickEventArgs) => void;

export interface JoystickOptions {

    scene: Phaser.Scene;
    x?: number;
    y?: number;
    size?: number;
    knobSize?: number;
    baseTextureKey?: string;
    knobTextureKey?: string;
    baseTint?: number;
    baseAlpha?: number;
    knobTint?: number;
    knobAlpha?: number;

    onMove?: JoystickEventHandler;
    onEnd?: JoystickEventHandler;
    onStart?: JoystickEventHandler;

    lockX?: boolean;
    lockY?: boolean;
    dynamic?: boolean;
    threshold?: number;
    fixedToCamera?: boolean;
    activationZone?: Phaser.GameObjects.Zone;
    depth?: number;
}

export class Joystick {
    private scene: Phaser.Scene;
    private options: Required<JoystickOptions>;

    public container: Phaser.GameObjects.Container;
    private base: Phaser.GameObjects.Image | Phaser.GameObjects.Graphics;
    private knob: Phaser.GameObjects.Image | Phaser.GameObjects.Graphics;

    private isActive: boolean = false;
    private activePointerId: number | null = null;

    private joystickRadius: number; // Radius dasar joystick, menentukan jarak tempuh maksimum kenop
    // private knobRadius: number; // Tidak secara langsung digunakan untuk position

    private currentBaseX: number = 0;
    private currentBaseY: number = 0;

    public x: number = 0;
    public y: number = 0;
    public angle: number = 0;
    public distance: number = 0;

    constructor(options: JoystickOptions) {
        this.scene = options.scene;

        const defaultX = this.scene.cameras.main.width / 2;
        const defaultY = this.scene.cameras.main.height / 2;

        this.options = {
            x: options.x ?? defaultX,
            y: options.y ?? defaultY,
            size: options.size ?? 120,
            knobSize: options.knobSize ?? 50,
            baseTextureKey: options.baseTextureKey ?? '',
            knobTextureKey: options.knobTextureKey ?? '',
            baseTint: options.baseTint ?? 0x888888,
            baseAlpha: options.baseAlpha ?? 0.5,
            knobTint: options.knobTint ?? 0x555555,
            knobAlpha: options.knobAlpha ?? 0.8,
            onMove: options.onMove ?? (() => {}),
            onEnd: options.onEnd ?? (() => {}),
            onStart: options.onStart ?? (() => {}),
            lockX: options.lockX ?? false,
            lockY: options.lockY ?? false,
            dynamic: options.dynamic ?? false,
            threshold: options.threshold ?? 0.01,
            fixedToCamera: options.fixedToCamera ?? false,
            activationZone: this.scene.add.zone(0,0, 120, 120),
            depth: options.depth ?? 0,
            ...options, // Sebarkan options lagi untuk memastikan scene dan callback utama tidak ter-override default
        };

        this.joystickRadius = this.options.size / 2;
        // this.knobRadius = this.options.knobSize / 2;

        this.container = this.scene.add.container(0, 0);
        this.container.setDepth(this.options.depth);
        if (this.options.fixedToCamera) {
            this.container.setScrollFactor(0);
        }

        this.createPhaserObjects();

        if (!this.options.dynamic) {
            this.positionJoystickElements(this.options.x, this.options.y);
            this.container.setVisible(true);
        } else {
            this.positionJoystickElements(this.options.x, this.options.y);
            this.container.setVisible(true); // Sembunyikan joystick dinamis pada awalnya
        }

        this.setupEventListeners();
    }

    private createPhaserObjects(): void {
        // Buat Dasar
        if (this.options.baseTextureKey && this.scene.textures.exists(this.options.baseTextureKey)) {
            this.base = this.scene.add.image(0, 0, this.options.baseTextureKey);
            this.base.setDisplaySize(this.options.size, this.options.size);
        } else {
            const graphicsBase = this.scene.add.graphics();
            graphicsBase.fillStyle(this.options.baseTint, this.options.baseAlpha);
            graphicsBase.fillCircle(0, 0, this.joystickRadius);
            this.base = graphicsBase;
        }
        this.base.setAlpha(this.options.baseAlpha);
        this.container.add(this.base);

        // Buat Kenop
        if (this.options.knobTextureKey && this.scene.textures.exists(this.options.knobTextureKey)) {
            this.knob = this.scene.add.image(0, 0, this.options.knobTextureKey);
            this.knob.setDisplaySize(this.options.knobSize, this.options.knobSize);
        } else {
            const graphicsKnob = this.scene.add.graphics();
            graphicsKnob.fillStyle(this.options.knobTint, this.options.knobAlpha);
            graphicsKnob.fillCircle(0, 0, this.options.knobSize / 2);
            this.knob = graphicsKnob;
        }
        this.knob.setAlpha(this.options.knobAlpha);
        this.container.add(this.knob);
    }

    private positionJoystickElements(centerX: number, centerY: number): void {
        this.currentBaseX = centerX;
        this.currentBaseY = centerY;
        this.container.setPosition(centerX, centerY);
        // Kenop direset ke tengah relatif terhadap kontainer
        this.knob.setPosition(0, 0);
    }

    private setupEventListeners(): void {
        const eventSource = this.options.activationZone || this.scene.input;
        if (this.options.activationZone) {
            const x = this.options.x + this.joystickRadius/2;
            const y = this.options.y + this.joystickRadius/2;
            this.options.activationZone.setInteractive({
                hitArea: new Phaser.Geom.Circle(x, y, this.joystickRadius),
                hitAreaCallback: Phaser.Geom.Circle.Contains
            });
        }

        eventSource.on(Phaser.Input.Events.POINTER_DOWN, this.handlePointerDown, this);
        // Listener untuk move dan up akan ditambahkan secara global saat pointer aktif
        this.scene.input.on(Phaser.Input.Events.POINTER_MOVE, this.handlePointerMove, this);
        this.scene.input.on(Phaser.Input.Events.POINTER_UP, this.handlePointerUp, this);
        this.scene.input.on(Phaser.Input.Events.POINTER_UP_OUTSIDE, this.handlePointerUp, this); // Menangani jika pointer dilepas di luar kanvas
    }

    private getPointerCoordinates(pointer: Phaser.Input.Pointer): { x: number; y: number } {
        if (this.options.fixedToCamera) {
            return { x: pointer.x, y: pointer.y };
        }
        return { x: pointer.worldX, y: pointer.worldY };
    }

    private handlePointerDown(pointer: Phaser.Input.Pointer): void {
        if (this.isActive) return; // Hanya satu pointer aktif per joystick

        // Jika ada activationZone, pastikan pointerdown terjadi di atasnya
        if (this.options.activationZone) {
            // Cek apakah pointer mengenai activationZone
            // Ini sedikit rumit karena eventSource bisa jadi scene.input
            // Cara yang lebih sederhana adalah jika activationZone adalah satu-satunya yang memicu ini.
            // Untuk sekarang, kita asumsikan jika activationZone ada, event ini hanya dipicu olehnya.
        }

        this.isActive = true;
        this.activePointerId = pointer.id;
        const pos = this.getPointerCoordinates(pointer);

        if (this.options.dynamic) {
            this.positionJoystickElements(pos.x, pos.y);
            this.container.setVisible(true);
        }

        this.processMovement(pos.x, pos.y); // Proses gerakan awal
        this.options.onStart?.(this.getValues());
    }

    private handlePointerMove(pointer: Phaser.Input.Pointer): void {
        if (!this.isActive || pointer.id !== this.activePointerId) return;

        const pos = this.getPointerCoordinates(pointer);
        this.processMovement(pos.x, pos.y);
    }

    private processMovement(pointerX: number, pointerY: number): void {
        if (!this.container) return;

        const maxDist = this.joystickRadius; // Jarak maksimum pusat kenop bisa bergerak

        if (maxDist === 0) { // Mencegah pembagian dengan nol jika size = 0
            this.x = 0; this.y = 0; this.angle = 0; this.distance = 0;
            this.knob.setPosition(0,0);
            this.options.onMove?.(this.getValues());
            return;
        }

        let dx = pointerX - this.currentBaseX;
        let dy = pointerY - this.currentBaseY;

        if (this.options.lockX) dx = 0;
        if (this.options.lockY) dy = 0;

        const currentDist = Math.sqrt(dx * dx + dy * dy);
        const angleRad = Math.atan2(dy, dx);

        let knobRelativeX = 0;
        let knobRelativeY = 0;
        let normalizedDistance = currentDist / maxDist;

        if (currentDist > maxDist) {
            knobRelativeX = Math.cos(angleRad) * maxDist;
            knobRelativeY = Math.sin(angleRad) * maxDist;
            normalizedDistance = 1;
        } else {
            knobRelativeX = dx;
            knobRelativeY = dy;
        }

        this.knob.setPosition(knobRelativeX, knobRelativeY);

        this.x = knobRelativeX / maxDist;
        this.y = knobRelativeY / maxDist; // Sumbu Y Phaser biasanya terbalik dari koordinat layar standar

        // Pastikan nilai x dan y tidak melebihi 1 atau -1 karena presisi floating point
        this.x = Math.max(-1, Math.min(1, this.x));
        this.y = Math.max(-1, Math.min(1, this.y));

        if (Math.sqrt(this.x * this.x + this.y * this.y) < this.options.threshold) {
            this.x = 0;
            this.y = 0;
            // Jangan reset angle dan distance jika hanya di bawah threshold,
            // kecuali jika kita ingin snap ke 0 sepenuhnya.
            // Untuk saat ini, biarkan angle dan distance mencerminkan input mentah sebelum threshold.
            // Jika x dan y adalah 0, distance juga harus 0.
            this.distance = 0;
            // Angle bisa tetap atau direset, tergantung preferensi. Reset ke 0 jika distance 0.
            this.angle = (this.x === 0 && this.y === 0) ? 0 : angleRad;
        } else {
            this.angle = angleRad;
            this.distance = normalizedDistance;
        }

        if (this.options.lockX) this.x = 0;
        if (this.options.lockY) this.y = 0;

        // Jika salah satu sumbu dikunci dan sumbu lainnya 0, maka distance dan angle harus 0.
        if ((this.options.lockX && this.y === 0) || (this.options.lockY && this.x === 0) || (this.x === 0 && this.y === 0)) {
             if (this.x === 0 && this.y === 0) { // Jika keduanya nol setelah penguncian atau threshold
                this.distance = 0;
                this.angle = 0; // Atau biarkan angle terakhir jika diinginkan
            }
        }

        this.options.onMove?.(this.getValues());
    }

    private handlePointerUp(pointer: Phaser.Input.Pointer): void {
        if (!this.isActive || pointer.id !== this.activePointerId) return;

        this.isActive = false;
        this.activePointerId = null;

        this.knob.setPosition(0, 0); // Kembalikan kenop ke tengah

        if (this.options.dynamic) {
            this.positionJoystickElements(this.options.x, this.options.y);
            // this.container.setVisible(false);
        }

        // const lastValues = this.getValues(); // Simpan nilai sebelum direset
        this.x = 0;
        this.y = 0;
        this.angle = 0;
        this.distance = 0;

        // Panggil onEnd dengan nilai terakhir sebelum reset, atau nilai reset (0,0)
        // Biasanya lebih berguna mengirim nilai (0,0) pada onEnd
        this.options.onEnd?.(this.getValues());
        // Jika ingin nilai terakhir sebelum reset:this.options.onEnd?.(lastValues);
    }

    /**
     * Mengembalikan nilai joystick saat ini.
     */
    public getValues(): JoystickEventArgs {
        return {
            x: this.x,
            y: this.y,
            angle: this.angle,
            distance: this.distance,
        };
    }

    /**
     * Menghancurkan joystick, membersihkan objek Phaser dan event listener.
     */
    public destroy(): void {
        const eventSource = this.options.activationZone || this.scene.input;
        eventSource.off(Phaser.Input.Events.POINTER_DOWN, this.handlePointerDown, this);

        this.scene.input.off(Phaser.Input.Events.POINTER_MOVE, this.handlePointerMove, this);
        this.scene.input.off(Phaser.Input.Events.POINTER_UP, this.handlePointerUp, this);
        this.scene.input.off(Phaser.Input.Events.POINTER_UP_OUTSIDE, this.handlePointerUp, this);

        if (this.container) {
            this.container.destroy(true); // true untuk menghancurkan semua children
        }
        // @ts-ignore
        this.base = null;
        // @ts-ignore
        this.knob = null;
        // @ts-ignore
        this.container = null;
        // @ts-ignore
        this.scene = null;
    }

    /** Mengatur visibilitas joystick */
    public setVisible(visible: boolean): this {
        if (this.container) {
            this.container.setVisible(visible);
        }
        return this;
    }
}

// Contoh penggunaan di dalam Scene Phaser:
/*
class MyScene extends Phaser.Scene {
    private joystick: Joystick | null = null;
    private player: Phaser.GameObjects.Sprite | null = null;

    constructor() {
        super({ key: 'MyScene' });
    }

    preload() {
        // this.load.image('player', 'path/to/player.png');
        // this.load.image('joystick_base', 'path/to/joystick_base.png');
        // this.load.image('joystick_knob', 'path/to/joystick_knob.png');
    }

    create() {
        // this.player = this.add.sprite(400, 300, 'player');

        this.joystick = new Joystick({
            scene: this,
            x: 150, // Posisi untuk joystick statis
            y: this.cameras.main.height - 150,
            // baseTextureKey: 'joystick_base', // Opsional
            // knobTextureKey: 'joystick_knob', // Opsional
            size: 100,
            knobSize: 40,
            dynamic: false, // Coba true untuk joystick dinamis
            fixedToCamera: true, // Agar tetap di UI layer
            onMove: (data) => {
                console.log(`Move: X=${data.x.toFixed(2)}, Y=${data.y.toFixed(2)}`);
                // if (this.player) {
                //     this.player.x += data.x * 5;
                //     this.player.y += data.y * 5; // Ingat sumbu Y Phaser
                // }
            },
            onEnd: () => {
                console.log('Joystick released');
            }
        });
    }

    update(time: number, delta: number) {
        // if (this.joystick && this.player) {
        //    const values = this.joystick.getValues();
        //    this.player.x += values.x * 5 * (delta / 1000); // Gerakan berbasis delta time
        //    this.player.y += values.y * 5 * (delta / 1000);
        // }
    }
}
*/