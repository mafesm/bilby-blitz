const TRANSITIONS = Object.freeze({
    playing: Object.freeze(['paused', 'victory', 'defeat']),
    paused: Object.freeze(['playing']),
    victory: Object.freeze([]),
    defeat: Object.freeze([])
});

export class GameState {
    constructor() {
        this.current = 'playing';
        this.observers = new Set();
    }

    get state() {
        return this.current;
    }

    subscribe(callback) {
        this.observers.add(callback);
        return () => this.observers.delete(callback);
    }

    transitionTo(next) {
        if (!TRANSITIONS[this.current]?.includes(next)) return false;

        const previous = this.current;
        this.current = next;
        this.notify(next, previous);
        return true;
    }

    reset() {
        if (this.current === 'playing') return;

        const previous = this.current;
        this.current = 'playing';
        this.notify('playing', previous);
    }

    notify(next, previous) {
        for (const callback of this.observers) callback(next, previous);
    }
}
