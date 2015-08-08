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
        loadScript(protocol + "cdn.firebase.com/js/client/2.2.1/firebase.js");


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
        loadStylesheet(protocol + "cdnjs.cloudflare.com/ajax/libs/font-awesome/4.3.0/css/font-awesome.min.css");



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
        loadStylesheet(protocol + "cdnjs.cloudflare.com/ajax/libs/bootswatch/3.3.4/sandstone/bootstrap.min.css");
        loadScript(protocol + "cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/3.3.4/js/bootstrap.min.js");



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


var MyApp = new Core();


/**
 * Registration / Auth for Demo App
 */

(function () {

    // Firebase-safe-key version of the host
    var host = window.location.host.replace('www.', '').replace(/\./g, '');
    MyApp.set('host', host);

    // Firebase-safe-key version of the pathname
    var pathname = window.location.pathname.replace(/\//g, '').replace(/\./g, '');
    MyApp.set('pathname', pathname);
    MyApp.set('pathName', pathname);

    function redirectWithPOST (timestamp) {
        var host = MyApp.get('host');
        var pathname = MyApp.get('pathname');
        var user = MyApp.get('userID');

        var form = $('<form action="" method="post">' +
            '<input type="hidden" name="host" value="' + host + '" />' +
            '<input type="hidden" name="pathname" value="' + pathname + '" />' +
            '<input type="hidden" name="user" value="' + user + '" />' +
            '<input type="hidden" name="timestamp" value="' + timestamp + '" />' +
            '</form>');
        $('body').append(form);
        form.submit();
    }

    function getSitesObj (userID) {
        userID = userID || MyApp.get('userID');
        var specificRef = new Firebase("https://wpages.firebaseio.com/users/" + userID);

        specificRef.on("value", function (snapshot) {
            var host = MyApp.get('host');
            var pathname = MyApp.get('pathname');
            var sitesObj = snapshot.val();
            MyApp.set('sitesObj', sitesObj);
            if (sitesObj && sitesObj.sites && sitesObj.sites[host] && sitesObj.sites[host][pathname] && sitesObj.sites[host][pathname].token) {
                var pageToken = sitesObj.sites[host][pathname].token;
                MyApp.set('pageToken', pageToken);
            }
        }, function (errorObject) {
            console.log("The read failed: " + errorObject.code);
        });
    }

    MyApp.registerGlobal('getSitesObj', getSitesObj);

    MyApp.registerGlobal('checkForUpdate', function () {
        var ref = new Firebase("https://wpages.firebaseio.com/users/" + MyApp.get('userID') + "/pages/" + MyApp.get('host') + "/" + MyApp.get('pathname'));
        ref.limitToLast(1).on("child_added", function(snapshot) {
            var ts = snapshot.key();
            var lastUpdated = $$('body').attr('data-last-updated') || 0;
            var hasCheckedForUpdate = MyApp.get('hasCheckedForUpdate');
            if (ts && ts > lastUpdated && typeof(MyAppIsDraft) !== "boolean" && !hasCheckedForUpdate) {
                console.log('unpublished version available from: ', ts);

                var search = window.location.search;
                if (search.indexOf('&draft') === -1)
                    search += "&draft";
                history.replaceState('redirect', 'redirect', window.location.pathname + search);

                redirectWithPOST(ts);
            } else if (typeof(MyAppIsDraft) === "boolean" && MyAppIsDraft) {
                MyApp.showPublishButton();
            }

        });
        MyApp.set('hasCheckedForUpdate', true);
        return true;
    });

    MyApp.registerGlobal('auth', function (callback, force) {

        // IF we have a callback
        if (callback && typeof(callback) === "function") {
            // Do not require authentication for SVGPEN (demo site)
            if (window.location.host === "svgpen.com" || window.location.host === "www.svgpen.com") return callback();

            // Do not require authentication for demos (unless forced)
            if (MyApp.get('isTemplate') && !force) return callback();
        }

        var authData = firebaseRef.getAuth();

        if (authData) {
            // console.log("Authenticated user with uid:", authData.uid);
            var userID = authData.uid;
            MyApp.set('userID', authData.uid);
            MyApp.set('userEmail', authData.password.email);
            getSitesObj(userID);
            if (callback && typeof(callback) === "function")
                callback();
        } else {
            // Modal
            vex.dialog.open({
                message: 'Enter your username and password:',
                input: "<input name=\"email\" type=\"text\" placeholder=\"Email\" required />\n<input name=\"password\" type=\"password\" placeholder=\"Password\" required /><br>Don't have an account? <a href='#' onclick='$(\".vex-dialog-button-secondary\").click();MyApp.createAccount()'>Create an account now</a>",
                buttons: [
                    $.extend({}, vex.dialog.buttons.YES, {
                        text: 'Login'
                    }), $.extend({}, vex.dialog.buttons.NO, {
                        text: 'Back'
                    })
                ],
                callback: function (data) {
                    if (data === false) {
                        // MyApp.lockBuilder();
                        return false; // Cancelled
                    }
                    firebaseRef.authWithPassword({ "email": data.email, "password": data.password
                    }, function (error, authData) {
                        if (error) {
                            // Todo: Try login again
                            Messenger().post({
                                message: "Login Failed! " + error + ' <a href="#" onclick="MyApp.resetPassword()">Reset Password</a>?',
                                type: 'error',
                                showCloseButton: true
                            });
                        } else {
                            var userID = authData.uid;
                            MyApp.set('userID', authData.uid);
                            MyApp.set('userEmail', authData.password.email);
                            getSitesObj(userID);
                            if (callback && typeof(callback) === "function") callback();
                        }
                    });
                }
            });
        }
    });

    MyApp.registerGlobal('createAccount', function () {
        vex.dialog.open({
            message: 'Please enter your email address and choose a password:',
            input: "<input name=\"email\" type=\"text\" placeholder=\"Email\" required />\n<input name=\"password\" type=\"password\" placeholder=\"Password\" required />",
            buttons: [
                $.extend({}, vex.dialog.buttons.YES, {
                    text: 'Create Account'
                }), $.extend({}, vex.dialog.buttons.NO, {
                    text: 'Back'
                })
            ],
            callback: function (data) {
                if (data === false) {
                    return false; // Cancelled
                }
                console.log(data.email, data.password);

                firebaseRef.createUser({
                    email: data.email,
                    password: data.password
                }, function(error, userData) {
                    if (error) {
                        switch (error.code) {
                            case "EMAIL_TAKEN":
                                console.log("The new user account cannot be created because the email is already in use.");
                                Messenger().post({
                                    message: "The new user account cannot be created because the email is already in use.",
                                    type: 'error',
                                    showCloseButton: true
                                });
                                break;
                            case "INVALID_EMAIL":
                                console.log("The specified email is not a valid email.");
                                Messenger().post({
                                    message: "The specified email is not a valid email.",
                                    type: 'error',
                                    showCloseButton: true
                                });
                                break;
                            default:
                                console.log("Error creating user:", error);
                                Messenger().post("Error creating user:", error);
                        }
                    } else {
                        console.log("Successfully created user account with uid:", userData.uid);
                        Messenger().post("Your account was created successfully.");
                        setTimeout(function () {
                            window.location.reload();
                        }, 2500);
                    }
                });

            }
        });
    })


    MyApp.registerGlobal('resetPassword', function () {

        vex.dialog.open({
            message: 'To reset your password, please enter your email address:',
            input: "<input name=\"email\" type=\"text\" placeholder=\"Email\" required />",
            buttons: [
                $.extend({}, vex.dialog.buttons.YES, {
                    text: 'Reset Password'
                }), $.extend({}, vex.dialog.buttons.NO, {
                    text: 'Back'
                })
            ],
            callback: function (data) {
                if (data === false) {
                    return true; // Cancelled
                }

                firebaseRef.resetPassword({
                    email: data.email
                }, function (error) {
                    if (error) {
                        switch (error.code) {
                            case "INVALID_USER":
                                Messenger().post({
                                    message: "The specified user account does not exist.",
                                    type: 'error',
                                    showCloseButton: true
                                });
                                break;
                            default:
                                Messenger().post({
                                    message: "Error resetting password: " + error,
                                    type: 'error',
                                    showCloseButton: true
                                });
                        }
                    } else {
                        Messenger().post("Your password has been reset. You should receive an email at the address provided.");
                    }
                });
            }
        });
    });
})();

