class MusicManager {
    constructor() {
        this.audio = new Audio();
        this.currentTrack = null;
        this.isMuted = false;
    }

    play(trackPath, loop = true) {
        if (this.currentTrack !== trackPath || this.audio.paused) {
            this.stop(); // stop any currently playing track
            this.audio.src = trackPath;
            this.audio.loop = loop;
            this.audio.volume = this.isMuted ? 0 : 0.5;
            this.audio.play().catch(err => console.error("Music playback error:", err));
            this.currentTrack = trackPath;
        }
    }
    
    stop() {
        if (this.audio) {
            this.audio.pause();
            this.audio.currentTime = 0;
        }
        this.currentTrack = null;
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        localStorage.setItem('isMuted', this.isMuted);
        this.audio.volume = this.isMuted ? 0 : 0.5;
    
        if (!this.isMuted && this.currentTrack) {
            this.audio.play();
        }
    }
}

const musicManager = new MusicManager();
export default musicManager;
