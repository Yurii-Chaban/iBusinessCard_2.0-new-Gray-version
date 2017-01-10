var VIDEOS = [];
var SLIDESHOW_VIDEOS = [];

(function($) {
    var playlists = [];

    $(document).ready(function() {

        znu.ios.swipe_emulation();

        znu.type.normalize_type(document.body, 'width', 1 / 60);

        $('.locked').each(function() {
            new Locked({el: this});
        });

        $('.cull').each(function() {
            new Cull({el: this});
        });

        // the cover's SVG will be init'ed here (and script is separate),
        // the rest are init'ed by the preloader
        $('.cover-split-quote').each(function() {
            new SplitQuote({el: this});
        });

        $('.image-parallax').each(function() {
            new ImageParallax({el: this});
        });

        $('.pull-quote-region').each(function() {
            new InterstitalOpacity({el: this});
        });

        $('.video-inner').each(function(idx, elem) {
            var a = znu.scale.autoscale(elem, 'cover', 'absolute');
            $(this).data('autoscale', a);
        });

        $('.autoscale').each(function(idx, elem) {
            var fitType = $(elem).data('fit-type');
            var fitPos = $(elem).data('fit-pos');
            if(fitType && fitPos) {
                var a = znu.scale.autoscale(elem, fitType, fitPos);
            } else if(fitType) {
                var a = znu.scale.autoscale(elem, fitType);
            } else {
                var a = znu.scale.autoscale(elem, 'fit');
            }

            $(this).data('autoscale', a);
        });

        var coverVid = null;

        $('div[preload]').each(function(idx, elem) {
            var $el = $(elem);

            if(znu.ios.on_ios && $el.data('fallback')) {

                $el.replaceWith($('<img>')
                                .attr('src', $el.data('fallback'))
                                .addClass('vid-replace')
                                .load(function(evt) {
                                    $(evt.currentTarget)
                                      .css({height: "100%", width: "100%"})
                                      .attr('width', '100%')
                                      .attr('height', '100%')
                                })
                            );

            } else {
                $el = $(elem);

                var v = znu.video.create(
                    elem.parentNode,
                    $.extend({'loop': 'loop'}, get_attribs_obj(elem)),
                    {
                        mp4:  $el.data('mp4-src'),
                        ogg:  $el.data('ogv-src'),
                        webm: $el.data('webm-src')
                    },
                    $el.data('fallback')
                );

                // we don't want to trigger our playlists with this
                if($el.parents('.video-slides').length == 0) {
                    VIDEOS.push(v);
                } else {
                    SLIDESHOW_VIDEOS.push(v);
                }

                if(idx == 0) {
                    coverVid = v;
                }

                elem.parentNode.removeChild(elem);

            }
        });

        $('.video-slides').each(function() {
            if(znu.ios.on_ios) {
                playlists.push(new ImageSlides({el: this}));
            } else {
                playlists.push(new VideoSlides({el: this}));
            }
        });

        if(!znu.ios.on_ios) {
            $(window).on('scroll resize load', function(evt) {
                var windowScrollTop = $(window).scrollTop();
                var windowHeight    = $(window).height();

                $.each(VIDEOS, function(idx, val) {
                    var vidPos = val.rect();

                    // pause any videos that are out of view
                    if(vidPos.top > (windowScrollTop + windowHeight) || 
                       (vidPos.top + vidPos.height) < windowScrollTop ||
                        $(val.el).parents(':not(:visible)').length > 0) {
                        val.pause();
                    } else {
                        val.play();
                    }
                });
            });
        }

        // loads the images SVG to raphael in bg after page load
        // will init the view when it's ready.
        $('.preloader-outer').each(function(idx, elem) {
            if(coverVid) {
                $(coverVid.el).one('playing', function() {
                    new ComboPreloader({el: elem});
                });
            } else {
                new ComboPreloader({el: this});
            }
        });

        // since they're not loading it through the preoloader via JS,
        // we'll just call it directly and it'll use image fallback
        if(znu.ios.on_ios) {
            $('.split-quote').each(function() {
                new SplitQuote({el: this});
            });
        }

        // firefox won't let you scroll when fullscreened
        if (BigScreen.enabled && !navigator.userAgent.match(/firefox/i)) {
            $('#fullscreen').click(function(evt) {
                BigScreen.toggle();
                $(evt.currentTarget).toggleClass('active');
            });
        } else {
            $('#fullscreen').addClass('disabled');
        }

        /* zinutils autoscale bug workaround */
        $(window).on('resize orientationchange', function() {
            $('.pull-quote .autoscale').each(function() {
                var a = $(this).data('autoscale');
                a.apply(
                    window.innerWidth || $(window).width(),
                    window.innerHeight || $(window).height());
            });
        });
    });
})(jQuery);

var ComboPreloader = Backbone.View.extend({

    initialize: function() {
        var self = this;

        _.bindAll(this, 'update');

        this.preloaders = [
            new ImagePreload({el: this.el}),
            new ScriptPreload({el: this.el})
        ];

        if(!(znu.ios.on_ios || navigator.userAgent.match(/MSIE/))) {
            this.preloaders.push(new VideoPreload({el: this.el}));
        }

        this.$preloader = this.$el.find('.preloader');

        this.totalCount = _.reduce(this.preloaders, function(memo, preloader) {
            return memo + preloader.totalCount;
        }, 0);

        this.currentCount = 0;

        this.$el.on('preload_item_complete', this.update);

        $.each(this.preloaders, function(idx, preloader) {
            preloader.preload();
        });
    },

    update: function(evt) {
        this.currentCount++;

        this.$preloader.css({
            width: (100 * this.currentCount / this.totalCount) + '%'
        });

        if(this.currentCount == this.totalCount) {
            this.$el.fadeOut(250);
        }
    }
});

var ScriptPreload = Backbone.View.extend({

    initialize: function() {
        _.bindAll(this, 'ready', 'scriptLoaded');

        this.scripts = [
            'http://pitchfork-features-cdn.s3.amazonaws.com/features/cover-story/reader/savages/js/allquotes.js'
        ];

        this.totalCount = this.scripts.length;
        this.preloadedCount = 0;
    },

    preload: function() {
        for(var i = 0; i < this.totalCount; i++) {
            $.getScript(this.scripts[i])
             .done(this.scriptLoaded);
        }
    },

    ready: function() {
        $('.split-quote').each(function() {
            new SplitQuote({el: this});
        });

        this.$el.trigger('preload_complete');
    },

    scriptLoaded: function() {
        this.preloadedCount++;
        this.$el.trigger('preload_item_complete');

        if(this.totalCount == this.preloadedCount) {
            this.ready();
        }
    }

});


var ImagePreload = Backbone.View.extend({

    initialize: function() {
        _.bindAll(this, 'ready', 'imageLoaded');

        this.$images    = $('img[data-img-src]');
        this.totalCount = this.$images.size();

        this.preloadedCount  = 0;
    },

    preload: function() {
        var self = this;

        $('img[data-img-src]').each(function(idx, elem) {
            $(elem).one('load', self.imageLoaded)
                   .attr('src', $(elem).data('img-src'));
        });
    },

    ready: function() {
        this.$el.trigger('preload_complete');
    },

    imageLoaded: function() {
        this.preloadedCount++;

        $(this.el).trigger('preload_item_complete');

        if(this.preloadedCount == this.totalCount) {
            this.ready();
        }
    }
});


var VideoPreload = Backbone.View.extend({
    initialize: function() {
        _.bindAll(this, 'videoReady');

        this.videos = VIDEOS.concat(SLIDESHOW_VIDEOS);
        this.totalCount = this.videos.length;
        this.preloadedCount = 0;
    },

    preload: function() {
        var self = this;

        $.each(this.videos, function(idx, vid) {
            if($(vid.el).attr('preload') != 'auto') {
                vid.preload('auto');
                $(vid.el).one('canplaythrough', self.videoReady);
            } else {
                self.videoReady();
            }
        });
    },

    ready: function() {
        this.$el.trigger('preload_complete');
    },

    videoReady: function(evt) {
        this.preloadedCount++;

        this.$el.trigger('preload_item_complete');

        if(this.preloadedCount == this.totalCount) {
            this.ready();
        }
    }
});

var ImageSlides = Backbone.View.extend({
    initialize: function(options) {
        _.bindAll(this, 'update');

        this.$sources      = this.$el.find('.video-inner');
        this.transitioning = false;
        this.currentVidIdx = -1;
        this.playlist      = [];
        this.bgColor       = this.$el.data('bg-color');

        this.lerp = znu.ipo.viewport_lerp(
            document.getElementById(this.$el.data('lerp-a')),
            document.getElementById(this.$el.data('lerp-b')),
            this.update
        );

        if(this.bgColor) {
            this.$el.parent().css('background-color', this.bgColor);
        }
    },

    update: function(v) {
        var scrollImgIdx = Math.floor(v * this.$sources.length);
        if(scrollImgIdx < 0) {
            scrollImgIdx = 0;
        } else if(scrollImgIdx >= this.$sources.length) {
            scrollImgIdx = this.$sources.length - 1;
        }
        this.showSlide(scrollImgIdx);
    },

    showSlide: function(idx) {
        this.$sources.eq(idx).fadeIn(1000);
        this.$sources.not(':eq(' + idx + ')').fadeOut(1000);
    }

});

var VideoSlides = Backbone.View.extend({
    initialize: function(options) {
        var self = this;

        _.bindAll(self, 'scrollUpdate', 'fadeUpdate');

        this.$sources      = this.$el.find('video');
        this.transitioning = false;
        this.currentVidIdx = -1;
        this.playlist      = [];
        this.updateMethod  = this.$el.data('update-method') || 'scroll';
        this.bgColor       = this.$el.data('bg-color');
        this.fadeLast      = this.$el.data('fade-last');
        this.fadeDelay     = this.$el.data('fade-delay');
        this.active        = false;

        this.$sources.filter(':gt(0)').css('opacity', 0);

        $(window).on('scroll', this.scrollUpdate);

        this.$sources.each(function(idx, elem) {
            var v = znu.video.wrap(elem, {});

            if(self.fadeLast && (idx == self.$sources.length - 1)) {
                $(elem).on('ended', self.fadeUpdate);
                $(elem).removeAttr('loop');
            } else {
                $(elem).attr('loop', 'loop');
            }

            self.stepSize = 1 / self.$sources.length;

            self.playlist.push(v);
        });

        if(this.bgColor) {
            this.$el.parent().css('background-color', this.bgColor);
        }
    },

    scrollUpdate: function(v) {
        var a = $('#' + this.$el.data('lerp-a')).offset();
        var b = $('#' + this.$el.data('lerp-b')).offset();
        var $w = $(window);

        var outTop = $w.scrollTop() + $w.outerHeight() < a.top;
        var outBottom = $w.scrollTop() > b.top;

        if((outTop || outBottom) && this.active) {
            this.pauseAll();
            this.currentVidIdx = -1;
            this.active = false;

            if(outTop) {
                this.setVideo(0);
            } else {
                this.setVideo(this.playlist.length - 1);
            }

            return;
        }

        if(!outTop && !outBottom) {
            this.active = true;
        }

        var aVal = $w.scrollTop() + $w.outerHeight() - a.top;
        var bVal = b.top - a.top + $w.outerHeight();

        var ratio = aVal / bVal;
        var f = znu.ipo.lerp(0, 1, ratio, .2, .6);
        if(f == 1) {
            var scrollVidIdx = this.playlist.length - 1;
        } else {
            var scrollVidIdx = Math.floor(f * this.playlist.length);
        }

        //change slides based on step
        if(this.currentVidIdx != scrollVidIdx && !this.transitioning) {
            this.playVideo(scrollVidIdx);
        }
    },

    pauseAll: function() {
        $.each(this.playlist, function(idx, vid) {
            vid.pause();
        });
    },

    fadeUpdate: function() {
        this.playlist[this.currentVidIdx].pause();
        this.fadeOut();
    },

    setVideo: function(idx) {
        $.each(this.playlist, function(i, vid) {
            if(idx == i) {
                vid.to(0.1);
                vid.pause();
                $(vid.el).css('opacity', 1);
            } else {
                $(vid.el).css('opacity', 0);
            }
        });
    },

    playVideo: function(newIdx) {
        var self = this;
        this.transitioning = true;
        var currentVid = this.playlist[this.currentVidIdx];
        var nextVid = this.playlist[newIdx];
        var transitionDur = $(nextVid.el).data('transition-duration');

        if(currentVid) {
            $(currentVid.el).animate({opacity: 0}, transitionDur, function() {
                currentVid.to(0.1);
                currentVid.pause();
            });
        }

        nextVid.play();
        $(nextVid.el).animate({opacity: 1}, transitionDur, function() {
                self.transitioning = false;
                self.currentVidIdx = newIdx;
            });
    },

    fadeOut: function() {
        var currentVid = this.playlist[this.currentVidIdx];
        $(currentVid.el).delay(this.fadeDelay)
                        .animate({opacity: 0.3}, 
                                 $(currentVid.el).data('transition-duration'));
    }
});




var SplitQuote = Backbone.View.extend({

    initialize: function(options) {

        _.bindAll(this, 'update', 'parallax');

        this.width        = this.$el.data('width');
        this.height       = this.$el.data('height');
        this.color        = this.$el.data('color');
        this.target       = this.$el.data('lerp-target');
        this.wrapperClass = this.$el.data('wrapper-class');
        this.explodeStyle = this.$el.data('explode-style');
        this.holdWindow   = this.$el.data('hold-window');
        this.svgFallback  = this.$el.data('svg');

        if (znu.ios.on_ios) {
            this.initImageReplace();
        } else if (window.Raphael && (Raphael.svg || Raphael.vml)) {
            this.initRaphael();
        } else {
            this.initPixel();
        }
    },

    initRaphael: function() {
        $raphElem = $('<div>').addClass('svg');
        if(this.wrapperClass) {
            $raphElem.addClass(this.wrapperClass)
        }
        im = IMAGES[$(this.el).data('vector')];

        this.$el.replaceWith($raphElem);

        // update view references
        this.el = $raphElem[0];
        this.$el = $(this.el);

        if (!this.width)
            this.width = im.width;
        if (!this.height)
            this.height = im.height;

        $raphElem.css('width', this.width);
        $raphElem.css('height', this.height);
        this.paper = Raphael($raphElem[0], '100%', '100%');
        this.paper.setViewBox(0, 0, parseFloat(im.width), parseFloat(im.height), true);
        im.fn(this.paper);

        this.set = this.paper.set();

        this.initSvg();

        this.lerp = znu.ipo.viewport_lerp(
            $(this.target).find('.lerp-a')[0],
            $(this.target).find('.lerp-b')[0],
            this.update
        );
    },

    initSvg: function() {
        var self = this;

        this.paper.forEach(function (el) {
            //add every element to a set so we can do bulk modifications and get
            //its size
            self.set.push(el);
        });

        var setBbox = self.set.getBBox();

        this.paper.forEach(function (el) {

            // get area, which we'll use to exclude things like quotes and 
            // points on lowercase i, j, etc
            var bbox = el.getBBox();
            var area = bbox.width * bbox.height;

            //pick a random third element or so
            if(Math.floor(Math.random() * 3) == 2 && area > 100) {
                var translateVal = (Math.floor(Math.random() * 20) + 15);

                if((bbox.y - bbox.height) < (setBbox.height / 2)) {
                    translateVal = -translateVal;
                }

                if(!self.explodeStyle || self.explodeStyle == 'both') {
                    el.attr({
                        transform: 't0,' + translateVal
                    });
                }

                el.data('translateVal', translateVal);
                el.data('scale', (Math.random() / 2) + 0.2);
            }
        });

        if(this.color) {
            this.set.attr({
                fill: this.color
            });
        }
    },

    initImageReplace: function() {
        var self = this;

        this.portraitOffset = this.$el.data('portrait-offset');
        newEl = $('<img>').attr('src', this.$el.data('svg'));
        this.$el.replaceWith(newEl);
        this.$el = newEl;
        this.el = newEl[0];

        if (this.width)
            this.$el.css('width', this.width);
        if (this.height)
            this.$el.css('height', this.height);

        this.$el.css({
            position: 'absolute',
            height: 'auto',
            top: '15%'
        });

        if(this.portraitOffset) {
            $(window).on('orientationchange', function() {
                if(typeof orientation === "undefined") {
                    return;
                }

                if(Math.abs(orientation) == 0 || Math.abs(orientation) == 180) {
                    self.$el.css('top', self.portraitOffset);
                } else {
                    self.$el.css('top', '0%');
                }
            });

            $(window).trigger('orientationchange');
        }

        this.lerp = znu.ipo.viewport_lerp(
            $(this.target).find('.lerp-a')[0],
            $(this.target).find('.lerp-b')[0],
            this.parallax
        );
    },

    initPixel: function() {
        newEl = $('<img>').attr('src', $(this).data('pixel'));
        this.$el.replaceWith(newEl);
        this.el = newEl;
        this.$el = $(newEl);
        if (this.width)
            this.$el.css('width', this.width);
        if (this.height)
            this.$el.css('height', this.height);
    },

    update: function(v) {
        if(self.explodeStyle != 'down') {
            this.parallax(v);
        }
        this.transformQuoteParts(v);
    },

    parallax: function(v) {
        var n = v * -35;
        apply_style(this.el, 'transform', 'translate(0,' + n + 'px)');
    },

    transformQuoteParts: function(v) {
        var self = this;
        var first = true;

        var normal = znu.ipo.lerp(0, 1, v);

        var diff = this.holdWindow / 2;
        var upperBound = .5 + diff;
        var lowerBound = .5 - diff;
        var slope = 1 / (1 - upperBound);

        this.paper.forEach(function (el) {
            if(el.data('translateVal') != undefined) {
                if(self.explodeStyle == 'down') {
                    var f = znu.ipo.lerp(0, el.data('translateVal'), normal - .5, 0, 1);
                } else {
                    if(normal >= upperBound) {
                        var n = (-slope * v) + slope;
                    } else if (normal <= lowerBound) {
                        var n = slope * v;
                    } else {
                        var n = 1;
                    }

                    var f = znu.ipo.lerp(el.data('translateVal'), 0, n, 0, 1);
                }
            }

            //var f = znu.ipo.lerp(el.data('translateVal'), 0, n, 0, 1);

            el.attr({
                transform: 't0,' + f
            });
        });
    }

});




var Locked = Backbone.View.extend({
    initialize: function(options) {
        _.bindAll(this, 'update', 'resize');

        this.attachment = 'top';

        this.$el.css({
            width: $(window).width(),
            height: $(window).height(),
            position: 'absolute',
            left: 0,
            top: 0,
            zIndex: -1
        });

        $(window).on('scroll', this.update);
        $(window).on('resize orientationchange', this.resize);
    },

    resize: function() {
        var width = window.innerWidth || $(window).width();
        var height = window.innerHeight || $(window).height();

        this.$el.css({
            width: $(window).width(),
            height: $(window).height()
        });
    },

    update: function() {
        var height = window.innerHeight || $(window).height();
        var rect = this.el.parentNode.getBoundingClientRect();
        var position = this.el.style.position;
        var attachment = this.attachment;

        if ((rect.top > height) || (rect.bottom < 0))
            this.el.style.visibility = 'hidden';
        else
            this.el.style.visibility = 'visible';

        if (rect.top < 0 && rect.bottom > height) {
            if (position != 'fixed')
                this.$el.css('position', 'fixed');
        } else {
            if (position != 'absolute')
                this.$el.css('position', 'absolute');
        }
        if (rect.bottom <= height) {
            if (this.attachment != 'bottom') {
                this.$el.css('top', 'auto');
                this.$el.css('bottom', '0');
            }
            this.attachment = 'bottom';
        } else {
            if (this.attachment != 'top') {
                this.$el.css('top', '0');
                this.$el.css('bottom', 'auto');
            }
            this.attachment = 'top';
        }
    }
});


var Cull = Backbone.View.extend({
    initialize: function(options) {
        _.bindAll(this, 'update');

        this.target = $(this.$el.data('target'))[0];

        $(window).on('load scroll', this.update);
    },

    update: function() {
        var rect = this.el.getBoundingClientRect();
        var height = window.innerHeight || $(window).height();

        if ((rect.top > height) || (rect.bottom < 0)) {
            this.target.style.display = 'none';
        } else {
            this.target.style.display = '';
        }
    }
});

var InterstitalOpacity = Backbone.View.extend({

    initialize: function(options) {
        _.bindAll(this, 'update');

        this.$target = $(this.$el.data('target'));

        znu.ipo.viewport_lerp(
            this.$el.find('.lerp-a')[0],
            this.$el.find('.lerp-b')[0],
            this.update
        );
    },

    update: function(v) {
        var f = znu.ipo.lerp(0.5, 1, v, 0, 0.2) * znu.ipo.lerp(1, 0.5, v, 0.8, 0.2);
        this.$target.css({opacity: f});
    }
});


var ImageParallax = Backbone.View.extend({
    initialize: function(options) {
        _.bindAll(this, 'update');

        this.$images       = this.$el.children();
        this.currentIdx    = 0;
        this.speed         = this.$el.data('speed');
        this.baseTransform = this.$el.data('base-transform');
        this.transitioning = false;

        this.lerp = znu.ipo.viewport_lerp(
            $(this.$el.data('lerp-a'))[0],
            $(this.$el.data('lerp-b'))[0],
            this.update
        );

        this.$images.load(this.resizeContainer);

        this.stepSize = 1 / this.$images.length;
        this.$images.filter(':gt(0)').css('opacity', 0);
    },

    update: function(v) {
        var self = this;

        var n = ((v * 2 - 1) * -this.speed) - this.baseTransform;
        apply_style(this.el, 'transform', 'translate(0,' + n + 'px)');

        /* Use .999 to avoid array out of bounds */
        var f = znu.ipo.lerp(0, .999, v, .1, .5);
        var imageIdx = Math.floor(f / this.stepSize);
        var $currentImg = this.$images.eq(this.currentIdx);

        //change slides based on step
        if(this.currentIdx != imageIdx) {
            this.changeImage(imageIdx);
        }
    },

    changeImage: function(newIdx) {
        var self = this;

        if(this.transitioning) {
            return;
        }

        this.transitioning = true;

        this.$images.eq(this.currentIdx)
                    .animate({'opacity': 0}, 400, 
                             function() {
                                self.$images.eq(newIdx)
                                    .animate({'opacity': 1}, 400, function() {
                                        self.currentIdx = newIdx;
                                        self.transitioning = false;
                                    });
                             });
    }
});


/* Extend zineutils base video to include our preload customizations */
znu.video.Video.prototype.canPlayThrough = false;

znu.video.Video.prototype.canPlayTrigger = function() {
    this.canPlayThrough = true;
};

znu.video.Video.prototype.rect = function() {
    var $el = $(this.el);
    var pos = $el.offset();
    return {
        left:   pos.left,
        top:    pos.top,
        width:  $el.outerWidth(),
        height: $el.outerHeight()
    };
};

znu.video.Video.prototype.preload = function(value) {
    if(value == undefined) {
        value = 'auto';
    }

    this.el.preload = value;
};

function apply_style(el, name, value) {
    var prefixes = ['-webkit-', '-moz-', '-ms-', '-o-', ''];
    for (var i = 0; i < 5; i++) {
        $(el).css(prefixes[i] + name, value);
    }
}

function get_attribs_obj(elem) {
    var toReturn = [];
    var nodemap = elem.attributes;

    for(var i = 0; i < nodemap.length; i++) {
        var node = nodemap.item(i);
        toReturn[node.nodeName] = node.nodeValue;
    }
    return toReturn;
}