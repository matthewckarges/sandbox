
$.fn.carouselify = function (options) {
    if (this.length == 0) return undefined;
    var settings = $.extend({
        autoScroll: false,
        autoScrollInterval: 2000,
        loop: false,
        settling: false,
        overScrolling: false,
        momentumScrolling: false,
        addDots: false,
        elementSelector: ".slideLink",
        listSelector: ".carouselList",
        slideMaxHeight: 315,
        slideMaxWidth: 480,
        maximizeSlideSize: true,
        leftButtonSelector: "",
        rightButtonSelector: "",
        elementPadding: 0,
        elementWrapper: ".slideWrapper"
    }, options);
    var object = this;
    if (settings.leftButtonSelector != "") {
        $(document).on("click", settings.leftButtonSelector, function(e) {
            e.preventDefault();
            carousel.AutoScroll.Stop();
            carousel.Slide("right");
            carousel.AutoScroll.Start();
        });
    }

    if (settings.rightButtonSelector != "") {
        $(document).on("click", settings.rightButtonSelector, function(e) {
            e.preventDefault();
            carousel.AutoScroll.Stop();
            carousel.Slide("left");
            carousel.AutoScroll.Start();
        });
    }

    var touchElement = settings.maximizeSlideSize == true ? settings.elementSelector : settings.elementSelector + ", " + settings.listSelector;
    this.on("touchstart mousedown", touchElement, function (e) {
        carousel.TouchStart(e);
    });

    this.on("touchmove mousemove", touchElement, function(e) {
        if (carousel.TouchStarted == true) {
            if (carousel.TouchMove(e) == true) {
                e.preventDefault();
            }
        }
    });

    this.on("touchend mouseup mouseleave", touchElement, function (e) {
        if (carousel.TouchStarted == true) {
            carousel.TouchFinish(e);
        }
    });

    this.on("click", settings.elementSelector, function(e) {
        if ($(this).attr("data-prevent-default") == "true") {
            e.preventDefault();
            e.stopImmediatePropagation();
        }
    });

    $(window).bind('orientationchange, resize', function () {
        carousel.Resize();
        carousel.HoldCurrentSlide();
    });

    //create banner objects with properties already loaded
    var banners = [];
    this.find(settings.elementSelector).each(function (i) {
        var banner = $(this);
	    var bannerObject = {
		    Banner: banner,
		    Width: function() {
			    return parseInt(this.Banner.css("width").replace("px", ""));
		    },
		    Link: banner.attr("href"),
		    Id: i,
		    X: function() {
			    return -(this.Banner[0].offsetLeft - carousel.Head().Banner[0].offsetLeft);
		    },
		    Wrapper: banner.parent(settings.elementWrapper),
		    Dot: $(".carouselControl[data-id=" +i + "]"),
		    DotWrapper: $(".carouselControl[data-id=" +i + "]").parent("li")
		};
		banner.css("display", "inline-block");
		bannerObject.Wrapper.css("display", "inline-block");
        banners.push(bannerObject);
    });
	var carousel = {
		DotControls: $(".carousel-controls"),
        Banners: banners,
        Window: {
            $: object,
            Width: function() {
                return parseInt(this.$.css("width").replace("px", ""));
            }
        },
        Head: function () {
            return this.Banners[0];
        },
        Tail: function () {
            return this.Banners[this.Count - 1];
        },
        Count: banners.length,
        HoldCurrentSlide: function () {
            this.AutoScroll.Stop();
            var x = this.CurrentSlide.X();
            this.This.css({
                marginLeft: x
            });
            this.AutoScroll.Start();
        },
        TouchStarted: false,
        TouchStart: function (e) {
	        if (this.Count > 1) {
		        var event = e.originalEvent.touches == undefined ? e.originalEvent : e.originalEvent.touches[0];
		        this.TouchStarted = true;
		        this.This.stop();
		        this.AutoScroll.Stop();
		        this.StartPosition.X = this.Position().X();
		        this.StartPosition.Y = this.Position().Y();
		        this.StartPosition.Time = e.timeStamp;
		        this.Touch.iX = event.pageX;
		        this.Touch.iY = event.pageY;
	        }
        },
        TouchMove: function (e) {
            var event = e.originalEvent.touches == undefined ? e.originalEvent : e.originalEvent.touches[0];
            this.Touch.pmX = this.Touch.mX;
            this.Touch.pT = this.Touch.mT;
            this.Touch.mX = event.pageX - this.Touch.iX;
            this.Touch.mT = e.timeStamp;
            this.Touch.acc = (this.Touch.pmX - this.Touch.mX) / (this.Touch.mT - this.Touch.pT);
            this.Touch.mY = event.pageY - this.Touch.iY;
            var marginMove = this.StartPosition.X +this.Touch.mX;
            if (settings.overScrolling == false) {
                if (marginMove > 0) {
                    marginMove = 0;
                } else if (marginMove < -(this.Position().Width() - this.Window.Width())) {
                    marginMove = false;
                }
            }
            if (marginMove !== false) {
                this.This.css({
                    marginLeft: marginMove
                });
            }
            this.Shift();
            if (Math.abs(this.Touch.mX) >= Math.abs(this.Touch.mY)) {
                return true;
            } else {
                return false;
            }

        },
        TouchFinish: function (event) {
            var slideLink = $(event.currentTarget);
            if (this.Touch.mX == 0 && this.Touch.mY == 0) {
                slideLink.attr("data-prevent-default", "false");
                if (isIphone() == true) {
                    if (slideLink.hasClass("bannerModalTrigger") == true) {
                        var contentUrl = slideLink.attr("data-url");
                        modal.LoadUrl(contentUrl, "");
                    } else {
                        var url = slideLink.attr("href");
                        if (url != undefined && url != "") {
                            window.location.href = url;
                        }
                    }
                }
            } else {
                slideLink.attr("data-prevent-default", "true");
            }
            this.Settle();
            this.ResetState();
        },
        ResetState: function () {
            this.TouchStarted = false;
            this.Touch.iX = 0;
            this.Touch.iY = 0;
            this.Touch.mX = 0;
            this.Touch.mY = 0;
            this.Touch.pmX = 0;
            this.Scrolling = "";
            this.AutoScroll.Start();
        },
        Scrolling: "",
        StartPosition: {
            X: 0,
            Y: 0,
            Time: 0
        },
        Position: function () {
            var parent = this;
            return {
                X: function () {
                    return parseInt(parent.This.css("marginLeft").replace("px", ""));
                },
                Y: function () {
                    return $(".website-panel").scrollTop();
                },
                Width: function () {
                    return parseInt(parent.This.css("width").replace("px", ""));
                }
            };
        },
        Touch: {
            iX: 0,
            iY: 0,
            mX: 0,
            mY: 0,
            pmX: 0,
            mT: 0,
            pmT: 0,
            acc: 0
        },
        Shift: function (left) {
            if (this.Count > 1 && settings.loop == true) {
                var leftMargin = left == true
                    ? this.Position().X() - this.CurrentSlide.Width()
                    : left == false
                        ? this.Position().X() - this.CurrentSlide.Width()
                        : this.Position().X();

                var width = this.Position().Width() - this.CurrentSlide.Width();

                if (leftMargin > 0) {
                    this.This.prepend(this.Tail().Wrapper);
                    this.Banners.unshift(this.Banners.pop());
                    this.This.css({
                        marginLeft: this.Position().X() - this.CurrentSlide.Width()
                    });
                    this.StartPosition.X -= this.CurrentSlide.Width();
                } else if (-leftMargin > width) {
                    this.This.append(this.Head().Wrapper);
                    this.Banners.push(this.Banners.shift());
                    this.This.css({
                        marginLeft: this.Position().X() + this.CurrentSlide.Width()
                    });
                    this.StartPosition.X += this.CurrentSlide.Width();
                }
            }
        },
        GetNewSlideIndex: function () {
            var carouselX = -this.Position().X();
            for (var i = 0; i < this.Count; i++) {
                var currentX = -this.Banners[i].X();
                if (carouselX < currentX) {
                    if (i == 0) {
                        return i;
                    } else {
                        var over = -this.Banners[i].X();
                        var under = -this.Banners[i - 1].X();
                        if (Math.abs(carouselX - over) < Math.abs(carouselX - under)) {
                            return i;
                        } else {
                            return i - 1;
                        }
                    }
                }
            }
            return this.Count - 1;
        },
        Settle: function () {
            if (settings.settling === true) {
                var newSlideIndex = this.GetNewSlideIndex();
                if (settings.momentumScrolling == true) {
                    if (this.Touch.pmX - this.Touch.mX > 3) {
                        newSlideIndex++;
                    } else if (this.Touch.pmX - this.Touch.mX < -3) {
                        newSlideIndex--;
                    }
                }
                newSlideIndex = newSlideIndex >= this.Count ? this.Count - 1 : newSlideIndex < 0 ? 0 : newSlideIndex;
                var newCurrentSlide = this.Banners[newSlideIndex];
                
                this.SetCurrentSlide(newCurrentSlide);
                this.This.animate({ marginLeft: this.CurrentSlide.X() }, 700, function() {});
            }
        },
        SlideTo: function (id, fn) {
        	var banner;
	        if (id != "head") {
		        for (var i = 0; i < this.Banners.length; i++) {
			        if (this.Banners[i].Id == id) {
				        banner = this.Banners[i];
				        break;
			        }
		        }
	        } else {
		        banner = this.Head();
	        }

	        if (banner == undefined) return;

			this.SetCurrentSlide(banner);
	        this.This.animate({ marginLeft: this.CurrentSlide.X() }, 700, function () {
		        if(fn != undefined) fn();
	        });
	    },
		SetCurrentSlide: function(banner) {
			this.CurrentSlide = banner;
			if (settings.addDots == true) {
				if ($(".carouselControl").length > 1) {
					$(".carouselControl:hidden").show();
					$(".carouselControl").removeClass("selected");
					this.CurrentSlide.Dot.addClass("selected");
				} else {
					$(".carouselControl").fadeOut(100);
				}
			}
		},
        InsertBefore: function(id, banner) {
        	this.This.css("width", this.Position().Width() + (banner.Width() + settings.elementPadding));

        	if (id == "head") {
        		this.This.prepend(banner.Wrapper);
        		var head = this.Head();
        		if (head != undefined) {
			        head.DotWrapper.before(banner.DotWrapper);
		        }
				this.Banners.splice(0, 0, banner);
	        } else {
		        for (var i = 0; i < this.Banners.length; i++) {
			        if (this.Banners[i].Id == id) {
			        	this.Banners[i].Wrapper.before(banner.Wrapper);
			        	this.Banners[i].DotWrapper.before(banner.DotWrapper);
			        	this.Banners.splice(i, 0, banner);
				        break;
			        }
		        }
	        }
	        if (id == "head" || this.CurrentSlide.Id >= id) {
		        this.This.css({
			        marginLeft: this.Position().X() - (banner.Width() + settings.elementPadding)
		        });
	        }
	        this.Count++;
	        this.DotControls.css("margin-left", -((this.Count-1) * 8 + 6));
	        this.Resize();
        },
        Detach: function (id) {
            var i;
            for (i=0; i<this.Banners.length; i++) {
                if (this.Banners[i].Id == id) {
                    break;
                }
            }
            var bannerObject = this.Banners.splice(i, 1)[0];
            bannerObject.Wrapper.detach();
	        bannerObject.Dot.removeClass("selected");
	        bannerObject.DotWrapper.detach();
            this.This.css({
            	marginLeft: this.Position().X() + (bannerObject.Width() + settings.elementPadding)
            });

            this.This.css("width", this.Position().Width() - (bannerObject.Width() + settings.elementPadding));
            this.Count--;
            this.DotControls.css("margin-left", -((this.Count - 1) * 8 + 6));
            return bannerObject;
        },
        AutoScroll: {
            Timer: false,
            Start: function () {
                if (settings.autoScroll == true) {
                    this.Stop();
                    this.Timer = setInterval(function () {
                        carousel.Slide("left");
                    }, settings.autoScrollInterval);
                }
            },
            Stop: function () {
                if (settings.autoScroll == true) {
                    clearInterval(this.Timer);
                    this.Timer = false;
                }
            },
            IsRunning: function () {
                return this.Timer !== false;
            }
        },
        Slide: function (direction) {
            var isLeft = direction == "left";
            this.Shift(isLeft);
            this.Touch.pmX = isLeft == true ? 4 : -4;
            this.Settle();
        },
		Hide: function(fn) {
			this.This.fadeOut(500, function() {
				if (fn != undefined) fn();
			});
		},
		Show: function(fn) {
			this.This.fadeIn(500, function() {
				if (fn != undefined) fn();
			});
		},
        SlideMaxHeight: settings.slideMaxHeight, // parseFloat($(".carouseWrapper").attr("data-height")),
        SlideMaxWidth: settings.slideMaxWidth, // parseFloat($(".carouseWrapper").attr("data-width")),
        Resize: function () {
            var pageWidth = object.parent().width();
            var pageHeight = $(window).height();
            var slideWidth;
            var slideHeight;

            var slideRatio = this.SlideMaxHeight / this.SlideMaxWidth;
            var landscapeRatio = this.SlideMaxWidth / this.SlideMaxHeight;
            var landscape;
            
            if (pageWidth > pageHeight) {
                landscape = true;
            } else {
                landscape = false;
            }

            if (landscape == false) {
                if (pageWidth >= this.SlideMaxWidth) {
                    slideHeight = this.SlideMaxHeight;
                    slideWidth = this.SlideMaxWidth;
                } else {
                    slideWidth = pageWidth;
                    slideHeight = pageWidth * slideRatio;
                }
            } else {

                var landscapeMaxImageHeight = .66 * pageHeight;

                if (landscapeMaxImageHeight > this.SlideMaxHeight) {

                    slideHeight = this.SlideMaxHeight;
                    slideWidth = this.SlideMaxWidth;
                } else {
                    slideHeight = landscapeMaxImageHeight;
                    slideWidth = landscapeRatio * slideHeight;
                }
            }
            if (settings.maximizeSlideSize == true) {
                try { slideWidth = parseInt(slideWidth); } catch (e) { }
                object.css("height", slideHeight);
                object.css("width", slideWidth);
                object.css("overflow", "hidden");
                object.css("margin-left", "auto");
                object.css("margin-right", "auto");
            	object.find(settings.listSelector).css("width", (slideWidth + settings.elementPadding) * this.Count);
                object.find(settings.listSelector).css("height", slideHeight);
                object.find(settings.elementSelector).css("height", slideHeight);
                object.find(settings.elementSelector).css("width", slideWidth);
                this.DotControls.css("margin-left", -((this.Count - 1) * 8 + 6));
            }

        },
        CurrentSlide: banners[0],
        This: object.find(settings.listSelector),
        Log: function (text) {
            $("#TESTINGTEXT").html(text);
            return text;
        }

    }
    object.find(settings.listSelector).show();
    carousel.AutoScroll.Start();
    carousel.Resize();

    return carousel;
}