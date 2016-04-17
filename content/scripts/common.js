function isIphone() {
    if ((navigator.userAgent.match(/iPhone/i)) || (navigator.userAgent.match(/iPod/i))) {
        return true;
    } else {
        return false;
    }
}