// import {html} from '@polymer/lit-element'
// FIXME temp dev version of lit-html
import {html} from 'lit-html'
import ComponentBase from './component-base'

const style = `
    :host { overflow: hidden; }
    video {
        opacity: .0000001;
        z-index: -1;
        position: absolute;
        top: 0; left: 0;
        object-fit: contain;
        width: 100%; height: 200%;
    } 
    canvas {
        width: 100%; height: 100%;
        object-fit: contain;
    }
`

const vertexShader = `
    varying vec2 vUv;
    void main()	{
        vUv = uv;
        gl_Position = vec4( position, 1.0 );
    }`

const fragmentShader = `
    uniform sampler2D videoTexture;
    varying vec2 vUv;

    void main(){
        vec2 halfUV = vec2(vUv.x, vUv.y * .5 + .5);
        vec3 color = texture2D( videoTexture, halfUV ).rgb;
        halfUV.y -= .5;
        vec3 alpha = texture2D( videoTexture, halfUV ).rgb;
        float grayscale = (alpha.r + alpha.g + alpha.b) / 3.;
        gl_FragColor = vec4(color, grayscale);
    }`

class AlphaVideo extends ComponentBase {

    /*
        public
    */

   static get properties() {
        return {
            src: String,
            poster: String,
            autoplay: Boolean,
            // playsinline: Boolean,
            muted: Boolean,
            loop: Boolean,
            preload: Boolean,
        }
    }

    get video (){ return this._video }
    // passthrough commonly used getters and setters for video props
    get videoWidth (){ return this._video.videoWidth }
    get videoHeight (){ return this._video.videoHeight }
    get currentSrc (){ return this._video.currentSrc }
    get duration (){ return this._video.duration }
    get error (){ return this._video.error }
    get paused (){ return this._video.paused }
    get buffered (){ return this._video.buffered }
    get readyState (){ return this._video.readyState }
    get seekable (){ return this._video.seekable }
    set currentTime (val){ this._video.currentTime = val }
    get currentTime (){ return this._video.currentTime }
    get volume (){ return this._video.volume }
    set volume (val){ this._video.volume = val }

    play(){
        // chrome isn't respecting these attributes unless we set the properties manually...
        // this._video.volume = this.volume
        // this._video.muted = this.muted
        this._video.play()
        this._draw()
    }

    pause(){
        this._video.pause()
    }

    /*
        private
    */

    _render(props) {
        // FIXME attribute propagation is breaking autoplay on chrome
        const content = html`
            <style>${style}</style>
            <canvas></canvas>
            <video src=${props.src} 
                playsinline
                muted
                autoplay
                ?loop=${props.loop}
                ?preload=${props.preload}
                ></video>
        `
        // ?muted=${props.muted}
        // ?autoplay=${props.autoplay}
        return content
    }

    _firstRendered(){
        
        // TODO get source elements
        // this._children = [].slice.call(this.childNodes).map(n => n.cloneNode())
        // this._children.forEach(node => this._video.appendChild(node))
        this._canvas = this.find('canvas')
        this._video = this.find('video')

        this._video.addEventListener('loadedmetadata', this._onLoadedMetadata.bind(this))

        const _scene = new THREE.Scene()
        const _camera = new THREE.OrthographicCamera( -2, 2, 2, -2, 1, 1000 )
        const _renderer = new THREE.WebGLRenderer({
            canvas: this._canvas,
            alpha: true,
        })

        const _videoTexture = new THREE.VideoTexture( this._video )
        _videoTexture.minFilter = THREE.NearestFilter
        _videoTexture.magFilter = THREE.NearestFilter

        const videoMaterial = new THREE.ShaderMaterial( {
            uniforms: {
                videoTexture: { value: _videoTexture },
            },
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            depthWrite: false,
            depthTest: false,
        } )

        const quad = new THREE.Mesh(
            new THREE.PlaneGeometry(2, 2),
            videoMaterial
        )
        _scene.add(quad)
        _camera.position.z = 5

        Object.assign(this, {
            _scene, _camera, _renderer, _videoTexture
        })

        // if(this.autoplay) {
        //     const onPlay = () => {
        //         this._draw()
        //         this._video.removeEventListener('play', onPlay)
        //     }
        //     this._video.addEventListener('play', onPlay)
        // }
    }
    
    _onLoadedMetadata(e){
        console.log('onloadeddata', e)
        this._camera.aspect = this._video.videoWidth / (this._video.videoHeight / 2)
        this._camera.updateProjectionMatrix()
        this._renderer.setSize( this._video.videoWidth, this._video.videoHeight / 2, false )
        if(this.autoplay){
            this.play()
        }
    }

    _draw(){
        // console.log('_draw', this._video.paused)
        if(this._video.paused) return
        this._renderer.render(this._scene, this._camera)
        requestAnimationFrame(this._draw.bind(this))
    }

}

customElements.define('alpha-video', AlphaVideo)

export default AlphaVideo
