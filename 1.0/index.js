/**
 * @fileoverview
 * @author 伊泽<yize.shc@gmail.com>
 * @module responsiveNav
 * @des 响应式菜单
 **/
KISSY.add(function (S, Node, D, E, Base) {

	var computed = !!window.getComputedStyle;
	var $ = Node.all;

	// fn arg can be an object or a function, thanks to handleEvent
	// read more at: http://www.thecssninja.com/javascript/handleevent
	var addEvent = function (el, evt, fn, bubble) {
			if ("addEventListener" in el) {
				// BBOS6 doesn't support handleEvent, catch and polyfill
				try {
					el.addEventListener(evt, fn, bubble);
				} catch (e) {
					if (typeof fn === "object" && fn.handleEvent) {
						el.addEventListener(evt, function (e) {
							// Bind fn as this and set first arg as event object
							fn.handleEvent.call(fn, e);
						}, bubble);
					} else {
						throw e;
					}
				}
			} else if ("attachEvent" in el) {
				// check if the callback is an object and contains handleEvent
				if (typeof fn === "object" && fn.handleEvent) {
					el.attachEvent("on" + evt, function () {
						// Bind fn as this
						fn.handleEvent.call(fn);
					});
				} else {
					el.attachEvent("on" + evt, fn);
				}
			}
		},

		removeEvent = function (el, evt, fn, bubble) {
			if ("removeEventListener" in el) {
				try {
					el.removeEventListener(evt, fn, bubble);
				} catch (e) {
					if (typeof fn === "object" && fn.handleEvent) {
						el.removeEventListener(evt, function (e) {
							fn.handleEvent.call(fn, e);
						}, bubble);
					} else {
						throw e;
					}
				}
			} else if ("detachEvent" in el) {
				if (typeof fn === "object" && fn.handleEvent) {
					el.detachEvent("on" + evt, function () {
						fn.handleEvent.call(fn);
					});
				} else {
					el.detachEvent("on" + evt, fn);
				}
			}
		};
	//noinspection JSCommentMatchesSignature
	/**
	 *
	 * @param nav String Elements ID
	 * @param config Object
	 * @returns {ResponsiveNav}
	 * @constructor
	 */
	function ResponsiveNav(nav, config) {

		var self = this;

		this.navOpen = false;
		this.navToggle = null;
		this.styleElement = document.createElement("style");
		this.navId = nav.replace('#', '');
		this.nav = S.one(nav);

		if (!this.nav) {
			throw new Error("The nav element you are trying to select doesn't exist");
		}

		ResponsiveNav.superclass.constructor.call(self, config);

		this.duration = this.get('duration');

		$(document.documentElement).addClass(this.get('jsClass'));

		// Inner wrapper
		this.inner = this.nav.children();
	}

	S.mix(ResponsiveNav, S.EventTarget);

	S.extend(ResponsiveNav, Base, /** @lends ResponsiveNav.prototype*/{
		destroy: function () {
			var self = this;
			this._removeStyles();
			this.nav.removeClass('closed opened');
			this.nav.removeAttr("style");
			this.nav.removeAttr("aria-hidden");
			this.nav = null;

			removeEvent(window, "load", this, false);
			removeEvent(window, "resize", this, false);
			removeEvent(this.navToggle, "mousedown", this, false);
			removeEvent(this.navToggle, "touchstart", this, false);
			removeEvent(this.navToggle, "touchend", this, false);
			removeEvent(this.navToggle, "keyup", this, false);
			removeEvent(this.navToggle, "click", this, false);

			if (!this.get('customToggle')) {
				this.navToggle.remove();
			} else {
				this.navToggle.removeAttr("aria-hidden");
			}
		},

		_createStyles: function () {
			if (!this.styleElement.parentNode) {
				document.getElementsByTagName("head")[0].appendChild(this.styleElement);
			}
		},

		_removeStyles: function () {
			if (this.styleElement.parentNode) {
				this.styleElement.parentNode.removeChild(this.styleElement);
			}
		},

		toggle: function () {
			var self = this;
			if (!this.navOpen) {
				this.nav.replaceClass('closed', 'opened');
//                this.nav.show(self.duration);
				this.navToggle.replaceClass('opened', 'closed');
				this.nav.css('position', self.get('openPos'));
				this.nav.attr('aria-hidden', "false");
				this.navOpen = true;
			} else {
				this.nav.replaceClass("opened", "closed");
//                this.nav.hide(self.duration);
				this.navToggle.replaceClass('closed', 'opened');
				this.nav.attr('aria-hidden', "true");

				this.navOpen = false;
//                opts.close();
			}
		},

		handleEvent: function (e) {
			var self = this;
			var evt = e || window.event;
			switch (evt.type) {
				case "mousedown":
					self._onmousedown(evt);
					break;
				case "touchstart":
					self._ontouchstart(evt);
					break;
				case "touchend":
					self._ontouchend(evt);
					break;
				case "keyup":
					self._onkeyup(evt);
					break;
				case "click":
					self._onclick(evt);
					break;
				case "resize":
					self._resize();
					break;
			}
		},

		init: function () {
			var self = this;
			this.nav.addClass('closed');
			this._createToggle();

			//初始化的时候先绑定下事件
			self._transitions();
			self._resize();

			addEvent(window, "resize", this, false);
			addEvent(this.navToggle, "mousedown", this, false);
			addEvent(this.navToggle, "touchstart", this, false);
			addEvent(this.navToggle, "touchend", this, false);
			addEvent(this.navToggle, "keyup", this, false);
			addEvent(this.navToggle, "click", this, false);

			this.navToggle.on("mousedown touchstart touchend keyup click", function (e) {
				self.handleEvent.call(self, e)
			}, false);

		},

		_createToggle  : function () {
			var self = this;
			var toggle = null;
			if (!this.get('customToggle')) {

				toggle = S.one(D.create('<a>', {
					href: '#',
					id  : this.navId + "-toggle",
					text: self.get('label')
				}));

				D['insert' + ((this.get('insert') === "After")
					? 'After'
					: 'Before')](toggle, this.nav);

				self.navToggle = toggle;

			} else {

				self.navToggle = toggle = S.one(this.get('customToggle'));

				if (!toggle) {
					throw new Error("The custom nav toggle you are trying to select doesn't exist");
				}

			}
		},
		_preventDefault: function (e) {
			if (e.preventDefault) {
				e.preventDefault();
				e.stopPropagation();
			} else {
				e.returnValue = false;
			}
		},

		_onmousedown: function (e) {
			var evt = e || window.event;
			// If the user isn't right clicking:
			if (!(e.which === 3 || e.button === 2)) {
				this._preventDefault(evt);
				this.toggle();
			}
		},

		_ontouchstart: function (e) {
			var evt = e || window.event;
			// Touchstart event fires before
			// the mousedown and can wipe it
			this.navToggle.onmousedown = null;
			this._preventDefault(evt);
			this.toggle();
		},

		_ontouchend: function () {
			var evt = e || window.event;
			// Prevents ghost click from happening on some Android browsers
			var self = this;
			this.nav.on("click", function (e) {
				self._preventDefault(evt);
			}, true);
			setTimeout(function () {
				self.nav.detach("click", function (e) {
					self._preventDefault(evt);
				}, true);
			}, self.get('duration'));
		},

		_onkeyup: function (e) {
			if (e.keyCode === 13) {
				this.toggle();
			}
		},

		_onclick: function (e) {
			var evt = e || window.event;
			this._preventDefault(evt);
		},

		_resize     : function () {

			if (this.navToggle.css("display") !== "none") {
				this.navToggle.attr("aria-hidden", "false");

				// If the navigation is hidden
				if (this.nav.hasClass('closed')) {
					this.nav.attr('aria-hidden', 'true');
					this.nav.css('position', 'absolute');
				}
				this._createStyles();
				this._calcHeight();
			} else {
				this.navToggle.attr('aria-hidden', 'true');
				this.nav.attr('aria-hidden', 'false');
				this.nav.css('position', this.get('openPos'));
				this._removeStyles();
			}

			this.fire('resize')
		},
		_calcHeight : function () {
			var savedHeight = 0;
			for (var i = 0, l = this.inner.length; i < l; i++) {
				savedHeight += this.inner[i].offsetHeight;
			}

			var innerStyles = '#' + this.navId + ".opened{max-height:" + savedHeight + "px}";

			// Hide from old IE
			if (computed) {
				this.styleElement.innerHTML = innerStyles;
				innerStyles = "";
			}
		},
		_transitions: function () {
			if (this.get('animate')) {
				var objStyle = this.nav.getDOMNode().style,
					transition = "max-height " + this.get('duration') + "ms";

				objStyle.WebkitTransition = transition;
				objStyle.MozTransition = transition;
				objStyle.OTransition = transition;
				objStyle.transition = transition;
			}
		},

	}, {ATTRS: /** @lends ResponsiveNav*/{
		animate     : {
			value: true
		},
		duration    : {
			value: '400'
		},
		label       : {
			value: "Menu"
		},
		insert      : {
			value: "After"
		},
		customToggle: {
			value: ""
		},
		openPos     : {
			value: "relative"
		},
		jsClass     : {
			value: "ks-responsive-nav-html"
		}
	}});

	return ResponsiveNav;
}, {requires: ['node', 'dom', 'event', 'base']});



