var background = (function () {
    var tmp = {};
    chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
        for (var id in tmp) {
            if (tmp[id] && (typeof tmp[id] === "function")) {
                if (request.path === 'background-to-page') {
                    if (request.method === id) tmp[id](request.data);
                }
            }
        }
    });
    /*  */
    return {
        "receive": function (id, callback) {
            tmp[id] = callback
        },
        "send": function (id, data) {
            chrome.runtime.sendMessage({"path": 'page-to-background', "method": id, "data": data})
        }
    }
})();

var font_inject = function () {


    var rand = {
        "noise": function () {
            var SIGN = Math.random() < Math.random() ? -1 : 1;
            return Math.floor(Math.random() + SIGN * Math.random());
        },
        "sign": function () {
            const tmp = [-1, -1, -1, -1, -1, -1, +1, -1, -1, -1];
            const index = Math.floor(Math.random() * tmp.length);
            return tmp[index];
        }
    };

    let rand_seed = null;
    if (window.localStorage['finger_font_inject']) {
        rand_seed = JSON.parse(window.localStorage['finger_font_inject']);
    } else {
        rand_seed = [];
        for (let i = 0; i < 256; i++) {
            rand_seed.push(rand.noise());
        }
        window.localStorage['finger_font_inject'] = JSON.stringify(rand_seed);
    }


    /**
     *  取出hash值
     * @param str
     */
    var getDomHash = function (dom, offset) {
        let innerText = dom.tagName + "_" + dom.innerText;
        let ret = 0;
        for (let i = 0; i < innerText.length; i++) {
            ret = (ret + innerText.charCodeAt(i) + offset) % 256;
        }
        return ret;
    }


    //
    Object.defineProperty(HTMLElement.prototype, "offsetHeight", {
        get() {
            const height = Math.floor(this.getBoundingClientRect().height);
            return height + rand_seed[getDomHash(this, height)];
        }
    });
    //
    Object.defineProperty(HTMLElement.prototype, "offsetWidth", {
        get() {
            const width = Math.floor(this.getBoundingClientRect().width);
            return width + rand_seed[getDomHash(this, width)];
        }
    });
    //
    document.documentElement.dataset.active = true;
};

var script_1 = document.createElement('script');
script_1.textContent = "(" + font_inject + ")()";
document.documentElement.appendChild(script_1);

if (document.documentElement.dataset.active !== "true") {
    var script_2 = document.createElement('script');
    script_2.textContent = `{
    const iframes = window.top.document.querySelectorAll("iframe[sandbox]");
    for (var i = 0; i < iframes.length; i++) {
      if (iframes[i].contentWindow) {
        if (iframes[i].contentWindow.HTMLElement) {
          iframes[i].contentWindow.HTMLElement.prototype.offsetWidth = HTMLElement.prototype.offsetWidth;
          iframes[i].contentWindow.HTMLElement.prototype.offsetHeight = HTMLElement.prototype.offsetHeight;
        }
      }
    }
  }`;
    //
    window.top.document.documentElement.appendChild(script_2);
}

window.addEventListener("message", function (e) {
    if (e.data && e.data === "font-fingerprint-defender-alert") {
        background.send("fingerprint", {"host": document.location.host});
    }
}, false);
