let account_jetbrains = async function () {
    let account_jetbrains_elm = document.getElementById('account_jetbrains');
    account_jetbrains_elm.addEventListener('click', async function () {
        //打开之前先清除缓存
        await chrome.browsingData.remove({
            "origins": ["https://jetbrains.com", "http://jetbrains.com"]
        }, {
            "cacheStorage": true,
            "cookies": true,
            "fileSystems": true,
            "indexedDB": true,
            "localStorage": true,
            "serviceWorkers": true,
            "webSQL": true
        });

        //注册账号
        chrome.tabs.create({url: 'https://account.jetbrains.com/login'}, async function (tab) {
            let bg = chrome.extension.getBackgroundPage();
            //开始自动注册流程
            bg.startRegisterAccount(tab.id);
        });


    }, false);
}


document.addEventListener('DOMContentLoaded', function () {
    //异步
    account_jetbrains();
});
