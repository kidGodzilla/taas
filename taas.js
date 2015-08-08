/**
 * Tours as a service
 */


window.TAAS = new Core();


(function () {

    function fullPath (el) {
        var current = el;
        var path = new Array();
        var realpath = "BODY";
        while ($(current).prop("tagName") != "BODY") {
            var index = $(current).parent().find($(current).prop("tagName")).index($(current));
            var name = $(current).prop("tagName");
            var selector = " " + name + ":eq(" + index + ") ";
            path.push(selector);
            current = $(current).parent();
        }
        while (path.length != 0) {
            realpath += path.pop();
        }
        return realpath;
    }


    TAAS.registerGlobal('init', function () {
        if (window.location.hash === "#taas-editor") {
            $(document).ready(function () {
                TAAS.set('mode', 'clicking');
                TAAS.highlighter();
                TAAS.bindClickEvents();
                TAAS.set('steps', []);
                TAAS.appendUI();
            });
        }
    });


    TAAS.registerGlobal('appendUI', function () {
        $('body').append("<button class='generator btn btn-primary' style='position:fixed;bottom:32px;right:32px;z-index:99999999999999999;' onclick='TAAS.logGeneratedCode()'>Generate Code</button>");

        $('.generator').click(function () {
            TAAS.set('debouncing', 1);
            setTimeout(function () {
                TAAS.set('debouncing', 0);
            }, 100);
        });
    });

    TAAS.registerGlobal('logGeneratedCode', function () {
        var res = TAAS.generateCode();
        if (res) {
            console.log('PASTE THE FOLLOWING INTO YOUR WEBSITE:');
            console.log(res);
            alert('The code has been generated. Check your console.');
        }
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
                TAAS.set('target', target);
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

    /**
     * Bind debounced click events
     */
    TAAS.registerGlobal('bindClickEvents', function () {
        var debounce;


        $('*:not(.generator)').on("click", function (event) {
            event.stopPropagation();
            event.preventDefault();

            var mode = TAAS.get('mode');

            var debouncing = TAAS.get('debouncing');
            if (!debouncing && mode === "clicking") {
                debouncing = true;

                clearTimeout(debounce);
                debounce = setTimeout(function () {
                    TAAS.set('debouncing', 0);
                }, 100);

                target = TAAS.get('target');
                var clickedPath = fullPath(target);
                TAAS.appendNewStep(clickedPath);
                TAAS.set('mode', 'crafting');
            }
        });
    });

    TAAS.registerGlobal('appendNewStep', function (selector) {
        $selectee = $(selector);
        var rans = Math.random().toString(36).substring(7);
        var sel = 'step-'+rans;
        $selectee.addClass(sel);

        var tour = new Shepherd.Tour({
            defaults: {
                classes: 'shepherd-theme-arrows'
            }
        });

        tour.addStep('example', {
            title: 'Example (click to edit)',
            text: 'Click here to edit the instructions for this step.',
            attachTo: '.'+sel,
            advanceOn: '.docs-link click',
            showCancelLink: true
        });

        tour.start();

        setTimeout(function () {
            $('.shepherd-title, .shepherd-text').attr('contenteditable', true);
            $('.shepherd-cancel-link').click(function () {
                TAAS.set('debouncing', 1);
                setTimeout(function () {
                    TAAS.set('debouncing', 0);
                }, 100);
                TAAS.set('mode', 'clicking');
            });
            $('.shepherd-button').click(function () {
                // TODO: Save the el
                var title = $('.shepherd-title').html();
                var text = $('.shepherd-text').html();

                var step = {
                    title: title,
                    text: text,
                    selector: selector,
                    sel: sel
                };
                TAAS.appendStep(step);


               TAAS.set('debouncing', 1);
                setTimeout(function () {
                    TAAS.set('debouncing', 0);
                }, 100);
               TAAS.set('mode', 'clicking');
            });
        }, 300);

    });


    TAAS.registerGlobal('appendStep', function (step) {
        var steps = TAAS.get('steps');
        steps.push(step);
        TAAS.set('steps', steps);
    });

    TAAS.registerGlobal('generateCode', function () {
        var code = "";
        var head = "<script src='//kidgodzilla.github.io/taas/loader.js'></script>\n\n<script>";
        var steps = TAAS.get('steps');

        if (!steps.length) return false;

        // Loop through each step in step
        for (var i = 0; i < steps.length; i++) {
            var step = steps[i];
            head += "$('"+step.selector+"').addClass('"+step.sel+"');\n";

            var nextText = (i === steps.length - 1) ? 'Done' : 'Next';

            code += "tour.addStep(null, {" +
            "    title: '"+step.title+"'," +
            "    text: '"+step.text+"'," +
            "    attachTo: '."+step.sel+"'," +
            "    advanceOn: '.docs-link click'," +
            "    showCancelLink: true," +
            "    buttons: [{" +
            "        text: 'Back'," +
            "        classes: 'shepherd-button-secondary'," +
            "        action: tour.back" +
            "        }, {" +
            "        text: '"+nextText+"'," +
            "        action: tour.next" +
            "   }]" +
            "});"


        }

        code = head +
        "\nvar tour = new Shepherd.Tour({" +
            "defaults: {" +
                "classes: 'shepherd-theme-arrows'" +
            "}" +
        "});\n\n" +
            code +
        "\n\ntour.start();\n</script>";

        return code;

    });


})();


TAAS.init();