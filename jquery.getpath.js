jQuery.fn.getPath = function () {
    var current = $(this);
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