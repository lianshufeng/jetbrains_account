const mailDomain = "jpy.wang";
const mailApi = "https://mail.api.jpy.wang";


/**
 * 入口
 */
const main = async () => {

}



const start_task = async () => {


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


    await chrome.tabs.create({url: 'https://www.jpy.wang/page/jetbrains.html'}, async function (tab) {
        console.log('welcome');
    });


    //注册账号
    await chrome.tabs.create({url: 'https://account.jetbrains.com/signup'}, async function (tab) {
        console.log('开始注册流程');
        await startRegisterAccount(tab.id);
    });

}


/**
 * 文本内容填充
 * @param text
 * @param dic
 */
textTemplate = (text, dic) => {
    let ret = text;
    //填充模版
    for (let key in dic) {
        ret = ret.replaceAll("@" + key + "@", dic[key]);
    }
    return ret;
}


/**
 * 随机生成字母
 * @param len
 * @returns {string}
 */
randomLetter = (len) => {
    //创建26个字母数组
    var arr = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];
    var idvalue = '';
    for (var i = 0; i < len; i++) {
        idvalue += arr[Math.floor(Math.random() * 26)];
    }
    return idvalue;
}

guid = function () {
    return 'xxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}


/**
 * 生成邮箱
 * @returns {Promise<string>}
 */
makeEmailAccount = async function () {
    let user = guid() + new Date().getTime();
    let url = mailApi + "/api/add?username=" + user;
    let ret = null;
    await fetch(url).then(async (data) => {
        ret = await data.text();
    })
    return user;
}

/**
 * 删除邮箱
 * @returns {Promise<void>}
 */
delEmailAccount = async (user) => {
    let url = mailApi + "/api/del?username=" + user;
    await fetch(url).then(async (data) => {
        console.log(data.text());
    })
}

/**
 * 接收邮件
 * @param user
 * @returns {Promise<void>}
 */
listenEmail = async function (tabId, user) {
    console.log('接收邮件:' + user);
    let url = mailApi + "/api/receive?username=" + user;

    let ret = null;
    await fetch(url).then(async (data) => {
        let text = await data.text();
        ret = JSON.parse(text)
    })

    if (ret && ret.content && ret.content.length > 0) {
        registerJetbrainsAccount(tabId, user, ret.content);
    } else {
        setTimeout(() => {
            listenEmail(tabId, user);
        }, 3000);
    }
}


/**
 * 开始注册账号
 * @param user
 * @param content
 */
registerJetbrainsAccount = function (tabId, user, content) {

    //提取中括号之间的字符
    function extractSubstring(str, startChar, endChar) {
        let regex = new RegExp(startChar + "(.*?)" + endChar);
        let match = str.match(regex);
        return match ? match[1] : null;
    }

    for (let i in content) {
        let registerJetbrainsMail = content[i].contents[0];
        mailToJetbrainsAccount(tabId, user, extractSubstring(registerJetbrainsMail, '\r\n\r\n', '\r\n\r\n'));
    }
}

/**
 * 邮件转换为账户
 */
mailToJetbrainsAccount = async function (tabId, user, registerJetbrainsMailCode) {
    // const url = registerJetbrainsMail;
    console.log('tabId:', tabId, 'user:', user, 'code:', registerJetbrainsMailCode)


    //执行脚本
    await chrome.scripting.executeScript({
        target: {tabId: tabId},
        function: async function (user, code) {
            for (let i = 0; i < code; i++) {
                await new Promise((resolve, reject) => {
                    //输入编码
                    let inputElement = document.getElementById('otp-' + (i + 1));
                    inputElement.value = code[i];
                    inputElement.dispatchEvent(new Event('input', {bubbles: true}));
                    setTimeout(resolve, 200);
                })
            }
        },
        args: [user, registerJetbrainsMailCode]
    });


    //等待点击按钮
    await new Promise((resolve, reject) => {
        setTimeout(resolve, 2000);
    })

    let firstName = randomLetter(4);
    let lastName = randomLetter(6);
    let userName = randomLetter(6);

    //输入内容
    await chrome.scripting.executeScript({
        target: {tabId: tabId},
        function: async function (firstName, lastName, userName, user) {

            //输入
            let inputElement = async function (id, value, timeout) {
                let element = document.getElementById(id);
                element.value = value;
                element.dispatchEvent(new Event('input', {bubbles: true}));
                await new Promise((resolve) => {
                    setTimeout(resolve, timeout);
                })
            }
            await inputElement('firstName', firstName, 200);
            await inputElement('lastName', lastName, 200);
            await inputElement('password', user, 1000);
        },
        args: [firstName, lastName, userName, user]
    });

    //点击提交按钮
    await chrome.scripting.executeScript({
        target: {tabId: tabId},
        function: async function (firstName, lastName, userName, user) {
            //点击按钮
            document.evaluate('//*[@id="root"]/main/div/div/div[3]/div/form/button', document).iterateNext().click()
            //延迟
            await new Promise((resolve) => {
                setTimeout(resolve, 1000);
            })
        },
        args: [firstName, lastName, userName, user]
    });


    let mail = user + "@" + mailDomain;
    let password = user;
    let tips = textTemplate(`
                            jetbrains 账户,注册完成!!!
                            邮箱: @username@
                            密码: @password@
                        `, {
        'username': mail, 'password': password
    })


    //等待页面并弹出提示

    while (true) {
        await new Promise((resolve) => {
            setTimeout(resolve, 1000);
        })
        let ret = await chrome.scripting.executeScript({
            target: {tabId: tabId},
            function: async function () {
                return window.location.href;
            },
            args: []
        });
        let url = ret[0].result;
        if (url.indexOf('/licenses') > -1) {
            break;
        }
    }

    console.log('创建完成:', tips, mail, password);
    // 打印提示
    chrome.scripting.executeScript({
        target: {tabId: tabId},
        function: function (tips, mail, password) {
            prompt(tips, mail + "  " + password);
        },
        args: [tips, mail, password]
    });


}


/**
 * 开始注册
 */
startRegisterAccount = async function (tabId) {
    //生成邮件
    let user = await makeEmailAccount();
    console.log('user : ' + user);


    //执行js , 注：v3 必须用这种写法
    const findAndInputEmail_handle = async function (email) {
        console.log(email);

        //点击继续按钮
        await new Promise((resolve) => {
            document.evaluate('//*[@id="root"]/main/div/div/div[2]/div/button[4]', document).iterateNext().click();
            setTimeout(resolve, 1000);
        })

        //输入邮箱
        await new Promise((resolve) => {

            let inputElement = document.evaluate('//*[@id="email"]', document).iterateNext();
            inputElement.value = email;
            inputElement.dispatchEvent(new Event('input', {bubbles: true}));

            setTimeout(resolve, 1000);
        })


        //点击下一步按钮
        await new Promise((resolve) => {
            document.evaluate('//*[@id="root"]/main/div/div/div[3]/div/form/button', document).iterateNext().click();
            setTimeout(resolve, 1000);
        })

    }


    //  执行js
    await chrome.scripting.executeScript({
        target: {tabId: tabId}, function: findAndInputEmail_handle, args: [user + "@" + mailDomain]
    });

    console.log('listen : ' + user);

    //开始接收邮件
    listenEmail(tabId, user);

}


// background.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "start_task") {
        start_task()
        const result = "开始自动注册";
        sendResponse({result: result});
    }
});



main();

