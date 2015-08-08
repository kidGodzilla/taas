/**
 * LOAD-DEPENDENCIES.JS
 * A A naive dependency loader which loads scripts & stylesheets on page load.
 */
(function () {

    /**
     * Sets the protocol for loading scripts, when the option is available (useful for local development)
     * Options: "http://", "https://", "file://", and "//"
     */
    var protocol = "http://";


    /**
     * Unique name for this instance of the script loader
     *
     * Prevents the loader from being called twice.
     * Change this if you use multiple instances of the script loader in your website,
     * or you want to distribute your package using this loader as an entry-point.
     */
    var loaderName = "asyncLoaderComplete";


    /**
     * Async script loader
     */
    function loadScriptAsync (resource) {
        var sNew = document.createElement("script");
        sNew.async = true;
        sNew.src = resource;
        var s0 = document.getElementsByTagName('script')[0];
        s0.parentNode.insertBefore(sNew, s0);
    }

    /**
     * Naive, synchronous script loader
     */
    function loadScript (resource) {
        document.write('<script src="' + resource + '"></script>');
    }

    /**
     * Stylesheet loader
     */
    function loadStylesheet (resource) {
        var head  = document.getElementsByTagName('head')[0];
        var link  = document.createElement('link');
        link.rel  = 'stylesheet';
        link.type = 'text/css';
        link.href = resource;
        link.media = 'all';
        head.appendChild(link);
    }

    /**
     * User-extendable dependency loader
     * To use, uncomment commonly-used libraries or add new scripts and stylesheets
     */
    if (!window[loaderName]) {

        /**************************************************************
         * COMMON JAVASCRIPT LIBRARIES
         * ************************************************************
         */

        /**
         * jQuery (v2.1.3)
         */
        if (!window.$) loadScript(protocol+ "cdnjs.cloudflare.com/ajax/libs/jquery/2.1.3/jquery.min.js");

        /**
         * Firebase (v2.2.1)
         * A document database in the cloud
         */
        // loadScript(protocol + "cdn.firebase.com/js/client/2.2.1/firebase.js");


        /**
         * Hubspot Messenger
         * A lightweight, beautiful notification library
         */
        loadStylesheet(protocol + "cdnjs.cloudflare.com/ajax/libs/messenger/1.4.0/css/messenger.css");
        loadStylesheet(protocol + "cdnjs.cloudflare.com/ajax/libs/messenger/1.4.0/css/messenger-theme-air.css");
        loadScript(protocol + "cdnjs.cloudflare.com/ajax/libs/messenger/1.4.0/js/messenger.min.js");
        document.write("<script>Messenger.options = { extraClasses: 'messenger-fixed messenger-on-top messenger-on-right', theme: 'air'};</script>");


        /**
         * Hubspot Vex
         * A lightweight, beautiful message window library, vex is a drop-in replacement for alert, confirm, and more.
         */
        loadStylesheet("http://wpages.co/old/wpce/vex.css");
        loadStylesheet("http://wpages.co/old/wpce/vex-theme-default.css");
        loadScript("http://wpages.co/old/wpce/vex.combined.min.js");
        document.write("<script>vex.defaultOptions.className = 'vex-theme-default';</script>");



        /**************************************************************
         * COMMON CSS LIBRARIES
         * ************************************************************
         */

        /**
         * Font-Awesome
         * A very useful icon pack
         */
        // loadStylesheet(protocol + "cdnjs.cloudflare.com/ajax/libs/font-awesome/4.3.0/css/font-awesome.min.css");



        /**************************************************************
         * BOOTSTRAP AND BOOTSWATCH THEMES
         * ************************************************************
         */



        /**
         * Bootstrap (Bootswatch Sandstone theme)
         * A touch of warmth
         *
         * See: https://bootswatch.com/sandstone/
         */
        // loadStylesheet(protocol + "cdnjs.cloudflare.com/ajax/libs/bootswatch/3.3.4/sandstone/bootstrap.min.css");
        // loadScript(protocol + "cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/3.3.4/js/bootstrap.min.js");



        // Once completed, set an identifier to true to avoid running the script loader twice
        window[loaderName] = true;
    }

})();


/****************************************************
 * Core.js
 ***************************************************/

'use strict';

function needsNew() {
    throw new TypeError("Failed to construct: Please use the 'new' operator, this object constructor cannot be called as a function.");
}

/**
 * a Generic core object
 */
var Core = (function () {

    var constructor = this;

    /**
     * Prevent direct execution
     */
    //if (!(this instanceof Core))
    //    needsNew();

    /**
     * datastore getter
     */
    function get (key) {
        return this.data[key];
    }


    /**
     * datastore setter
     */
    function set (key, value) {
        return this.data[key] = value;
    }


    /**
     * Executes an array of functions, Sequentially
     */
    function executeFunctionArray (functionArray, args) {
        if (typeof(functionArray) !== "object" || !functionArray.length) return false;

        for (var i = 0; i < functionArray.length; i++) {
            args = functionArray[i](args);
        }

        return args;
    }


    /**
     * Registers a new global on the current object
     */
    function registerGlobal (key, value) {

        if (typeof(this[key]) === "undefined") {

            if (typeof(value) === "function") {

                this[key] = function () {
                    /**
                     * Prepare Arguments
                     *
                     * TODO: (Source: MDN)
                     * You should not slice on arguments because it prevents optimizations in JavaScript
                     * engines (V8 for example). Instead, try constructing a new array by iterating
                     * through the arguments object.
                     */
                    // var args = Array.prototype.slice.call(arguments);
                    var args = arguments;
                    if (args.length === 0) args = null;

                    /**
                     * Execute Before hooks on the arguments
                     */
                    if (this.hooks[key] && this.hooks[key].before && this.hooks[key].before.length > 0)
                        args = executeFunctionArray(this.hooks[key].before, args);

                    /**
                     * Execute the intended function
                     */
                    var result = value.apply(this, args);

                    /**
                     * Execute After hooks on the result
                     */
                    if (this.hooks[key] && this.hooks[key].after && this.hooks[key].after.length > 0)
                        result = executeFunctionArray(this.hooks[key].after, result);

                    return result;
                };

            } else {

                // If the global is being set to any other type of object or value, just do it.
                this[key] = value;

            }

        } else {
            console.log("ERROR: A module attempted to write to the `" + key + "` namespace, but it is already being used.");
        }
    }


    /**
     * Registers a new before hook on a method
     *
     * Example:
     * We could add a before hook to generateUID which always set the separator to `+`
     *
     * ```javascript
     * this.before('generateUID', function(args) {
     *     if (args) args[0] = '+';
     *     return args;
     * });
     * ```
     *
     * Then, when we called generateUID('-'), we would get a GUID separated by `+` instead.
     *
     * TODO: Consider moving this.before & this.after to a private namespace to they cannot
     * be easily accessed by 3rd party code.
     *
     */
    function before (key, func) {
        if (!this.hooks[key]) this.hooks[key] = {};
        if (!this.hooks[key].before) this.hooks[key].before = [];
        this.hooks[key].before.push(func);
    }


    /**
     * Registers a new after hook on a this method
     */
    function after (key, func) {
        if (!this.hooks[key]) this.hooks[key] = {};
        if (!this.hooks[key].after) this.hooks[key].after = [];
        this.hooks[key].after.push(func);
    }


    /**
     * Return public objects & methods
     */
    var obj = {
        data: {},
        hooks: {},
        executeFunctionArray: executeFunctionArray,
        registerGlobal: registerGlobal,
        __proto__: constructor,
        before: before,
        after: after,
        get: get,
        set: set
    };

    return function () {
        return obj;
    };
})();

/* global define:true module:true window: true */
if (typeof define === 'function' && define['amd'])      { define(function() { return Core; }); }
if (typeof module !== 'undefined' && module['exports']) { module['exports'] = Core; }
if (typeof window !== 'undefined')                      { window['Core'] = Core; }



/**
 * Begin Demo App
 */


var TAAS = new Core();


(function () {
    TAAS.registerGlobal('init', function () {
        TAAS.highlighter();
    });

    /**
     * Highlights DOM elements beneath the cursor
     */
    TAAS.registerGlobal('highlighter', function () {
        var box = $("<div class='outer' />").css({
            display: "none", position: "absolute",
            zIndex: 65000, background:"rgba(255, 0, 0, .3)"
        }).appendTo("body");
        var mouseX, mouseY, target, lastTarget;
        // in case you need to support older browsers use a requestAnimationFrame polyfill// e.g: https://gist.github.com/paulirish/1579671
        window.requestAnimationFrame(function frame() {
            window.requestAnimationFrame(frame);
            if (target && target.className === "outer") {
                box.hide();
                target = document.elementFromPoint(mouseX, mouseY);
            }
            box.show();

            if (target === lastTarget) return;

            lastTarget = target;
            var $target = $(target);
            var offset = $target.offset();
            box.css({
                width:  $target.outerWidth()  - 1,
                height: $target.outerHeight() - 1,
                left:   offset.left,
                top:    offset.top
            });
        });

        $("body").mousemove(function (e) {
            mouseX = e.clientX;
            mouseY = e.clientY;
            target = e.target;
        });
    });
})();




TAAS.init();