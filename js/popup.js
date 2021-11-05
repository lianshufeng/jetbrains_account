var $ = function (id) {
    return document.getElementById(id);
}
var Softdown = {
    account_jetbrains: function () {
        $('account_jetbrains').addEventListener('click', function () {
            chrome.tabs.create({url: 'https://account.jetbrains.com/login'}, function (tab) {
                chrome.tabs.executeScript(
                    tab.id,
                    {
                        code: 'alert(111)'
                    }
                );
            });
        }, false);
    }
}

document.addEventListener('DOMContentLoaded', function () {
    Softdown.account_jetbrains();
});
