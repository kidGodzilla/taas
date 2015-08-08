/**
 * Tours as a service
 */


window.TAAS = new Core();


(function () {

    function fullPath (el) {
        var path, node = this;
        while (node.length) {
            var realNode = node[0], name = realNode.localName;
            if (!name) break;
            name = name.toLowerCase();

            var parent = node.parent();

            var sameTagSiblings = parent.children(name);
            if (sameTagSiblings.length > 1) {
                allSiblings = parent.children();
                var index = allSiblings.index(realNode) + 1;
                if (index > 1) {
                    name += ':nth-child(' + index + ')';
                }
            }

            path = name + (path ? '>' + path : '');
            node = parent;
        }

        return path;
    }


    TAAS.registerGlobal('init', function () {
        TAAS.highlighter();
        TAAS.bindClickEvents();
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

    TAAS.registerGlobal('bindClickEvents', function () {
        var debouncing = 0;
        var debounce;


        $('*').on("click", function (event) {
            event.stopPropagation();
            event.preventDefault();

            if (!debouncing) {
                debouncing = true;

                clearTimeout(debounce);
                debounce = setTimeout(function () {
                    debouncing = 0;
                }, 500);

                target = TAAS.get('target');

                console.log(target);
                var clickedPath = fullPath(target);
                console.log('you clicked on button ' + clickedPath);
            }
        });
    });
})();


TAAS.init();