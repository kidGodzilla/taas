/**
 * Tours as a service
 */


window.TAAS = new Core();


(function () {

    function fullPath (el) {
        var names = [];
        while (el.parentNode){
            if (el.id){
                names.unshift('#'+el.id);
                break;
            } else {
                if (el==el.ownerDocument.documentElement) names.unshift(el.tagName);
                else {
                    for (var c=1,e=el;e.previousElementSibling;e=e.previousElementSibling,c++);
                    names.unshift(el.tagName+":nth-child("+c+")");
                }
                el = el.parentNode;
            }
        }
        return names.join(" > ");
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
        $(document).on("click", function () {
            var clickedPath = fullPath($(this));
            alert('you clicked on button ' + clickedPath);
        });
    });
})();


TAAS.init();