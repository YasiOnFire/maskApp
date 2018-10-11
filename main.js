/* FaceDetection "App" build as part of CodePen challenge. Stack: Vue, Camvas, Pico*/
Vue.use(VueAwesomeSwiper)
new Vue({
  el: '#app',
  data: {
    options: {
      grabCursor: true,
      pagination: {
        el: '.swiper-pagination',
        dynamicBullets: true
      }
    },
    maskScale: 1.2,
    canv: null,
    currMask: null,
    currMaskIndex: 0,
    yOffset: 0,
    imgData: null,
    videoPlayer: null,
    message: 'Enable camera'
  },
  watch: {
    currMaskIndex(val) {
      this.currMask = document.getElementById(`image${parseInt(this.currMaskIndex)}`);
    }
  },
  methods: {
    toggleFullscreen() {
      function errorHandler() {
        alert('mozfullscreenerror')
      }
      document.documentElement.addEventListener('mozfullscreenerror', errorHandler, false)

      if (!document.fullscreenElement && !document.mozFullScreenElement && !document.webkitFullscreenElement) {
        if (document.documentElement.requestFullscreen) {
          document.documentElement.requestFullscreen()
        } else if (document.documentElement.mozRequestFullScreen) {
          document.documentElement.mozRequestFullScreen()
        } else if (document.documentElement.webkitRequestFullscreen) {
          document.documentElement.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT)
        }
      } else {
        if (document.cancelFullScreen) {
          document.cancelFullScreen()
        } else if (document.mozCancelFullScreen) {
          document.mozCancelFullScreen()
        } else if (document.webkitCancelFullScreen) {
          document.webkitCancelFullScreen()
        }
      }
    },
    initCamera() {
      const _this = this
      let initialized = false;
      if (initialized)
        return;

      let update_memory = pico.instantiate_detection_memory(5);
      let facefinder_classify_region = function (r, c, s, pixels, ldim) {
        return -1.0;
      };
      let cascadeurl = 'https://raw.githubusercontent.com/nenadmarkus/pico/c2e81f9d23cc11d1a612fd21e4f9de0921a5d0d9/rnt/cascades/facefinder';
      fetch(cascadeurl).then(function (response) {
        response.arrayBuffer().then(function (buffer) {
          var bytes = new Int8Array(buffer);
          facefinder_classify_region = pico.unpack_cascade(bytes);
        })
      })
      _this.canv = document.getElementsByTagName('canvas')[0]
      _this.canv.width = document.getElementsByClassName('video-wrp')[0].offsetWidth
      _this.canv.height = document.getElementsByClassName('video-wrp')[0].offsetHeight
      const ctx = _this.canv.getContext('2d');

      function rgba_to_grayscale(rgba, nrows, ncols) {
        var gray = new Uint8Array(nrows * ncols);
        for (var r = 0; r < nrows; ++r)
          for (var c = 0; c < ncols; ++c)
            gray[r * ncols + c] = (2 * rgba[r * 4 * ncols + 4 * c + 0] + 7 * rgba[r * 4 * ncols + 4 * c + 1] + 1 * rgba[r * 4 * ncols + 4 * c + 2]) / 10;
        return gray;
      }

      const processfn = function (video, dt) {
        _this.message = 'Swipe left and right'

        ctx.drawImage(video, 0, 0, _this.canv.width, _this.canv.height);
        var rgba = ctx.getImageData(0, 0, _this.canv.width, _this.canv.height).data;
        image = {
          "pixels": rgba_to_grayscale(rgba, _this.canv.height, _this.canv.width),
          "nrows": _this.canv.height,
          "ncols": _this.canv.width,
          "ldim": _this.canv.width
        }
        params = {
          "shiftfactor": 0.1,
          "minsize": 30,
          "maxsize": 1000,
          "scalefactor": 1.1
        }
        dets = pico.run_cascade(image, facefinder_classify_region, params);
        dets = update_memory(dets);
        dets = pico.cluster_detections(dets, 0.2);
        for (i = 0; i < dets.length; ++i)
          if (dets[i][3] > 50.0) {
            ctx.beginPath();
            ctx.arc(dets[i][1], dets[i][0], dets[i][2] / 2, 0, 2 * Math.PI, false);
            // ctx.lineWidth = 3;
            // ctx.strokeStyle = 'red';
            ctx.drawImage(_this.currMask, dets[i][1] - (dets[i][2] / 2) * _this.maskScale, (dets[i][0] - (dets[i][2] / 2) * _this.maskScale) + parseInt(_this.yOffset), dets[i][2] * _this.maskScale, dets[i][2] * _this.maskScale);
            // ctx.stroke();
          }
      }
      const mycamvas = new camvas(ctx, processfn);
      initialized = true;
    },
    takePicture() {
      document.getElementById('flash').classList.add('on')
      this.imgData = this.canv.toDataURL();
      setTimeout(() => {
        document.getElementById('download').click();
      }, 100)
      setTimeout(() => {
        document.getElementById('flash').classList.remove('on')

      }, 4000)
    },
    changeIndex() {
      this.currMaskIndex = this.swiper.activeIndex;
    }
  },
  computed: {
    swiper() {
      return this.$refs.masksSwiper.swiper
    }
  },
  components: {
    LocalSwiper: VueAwesomeSwiper.swiper,
    LocalSlide: VueAwesomeSwiper.swiperSlide,
  },
  mounted() {
    this.currMask = document.getElementById(`image${parseInt(this.currMaskIndex)}`);
    this.videoPlayer = document.querySelector("#videoElement")
    this.initCamera()
  },
});
