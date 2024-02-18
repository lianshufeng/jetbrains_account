const mailDomain = "jpy.wang";


/**
 * 入口
 */
const main = async () => {


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
    await chrome.tabs.create({url: 'https://account.jetbrains.com/login'}, async function (tab) {
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
    var arr = [
        'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
        'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'
    ];
    var idvalue = '';
    for (var i = 0; i < len; i++) {
        idvalue += arr[Math.floor(Math.random() * 26)];
    }
    return idvalue;
}

guid = function () {
    return 'xxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0,
            v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}


/**
 * 生成邮箱
 * @returns {Promise<string>}
 */
makeEmailAccount = async function () {
    let user = guid() + new Date().getTime();
    let url = "https://mail.api.jpy.wang/api/add?username=" + user;
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
    let url = "https://mail.api.jpy.wang/api/del?username=" + user;
    await fetch(url).then(async (data) => {
        console.log(data.text());
    })
}

/**
 * 接收邮件
 * @param user
 * @returns {Promise<void>}
 */
listenEmail = async function (user) {
    console.log('接收邮件:' + user);
    let url = "https://mail.api.jpy.wang/api/receive?username=" + user;

    let ret = null;
    await fetch(url).then(async (data) => {
        let text = await data.text();
        ret = JSON.parse(text)
    })

    if (ret && ret.content && ret.content.length > 0) {
        registerJetbrainsAccount(user, ret.content);
    } else {
        setTimeout(() => {
            listenEmail(user);
        }, 3000);
    }
}


/**
 * 开始注册账号
 * @param user
 * @param content
 */
registerJetbrainsAccount = function (user, content) {
    for (let i in content) {
        let registerJetbrainsMail = content[i].contents[0];

        //提取中括号之间的字符
        const extractString = function (inputString) {
            const matches = inputString.match(/\[(.*?)\]/);
            return matches ? matches[1] : '未找到匹配的方括号';
        }

        mailToJetbrainsAccount(user, extractString(registerJetbrainsMail));
    }
}

/**
 * 邮件转换为账户
 */
mailToJetbrainsAccount = function (user, registerJetbrainsMail) {
    const url = registerJetbrainsMail;
    console.log(url)

    //打开页面
    chrome.tabs.create({url: url}, async function (tab) {


        let firstName = randomLetter(4);
        let lastName = randomLetter(6);
        let userName = randomLetter(6);


        //在内部页面执行
        const findAndInputJetbrainsAccount_handle = function (firstName, lastName, userName, user) {

            document.evaluate('//*[@id="firstName"]', document).iterateNext().value = firstName
            document.evaluate('//*[@id="lastName"]', document).iterateNext().value = lastName
            document.evaluate('//*[@id="userName"]', document).iterateNext().value = userName
            document.evaluate('//*[@id="password"]', document).iterateNext().value = user
            document.evaluate('//*[@id="pass2"]', document).iterateNext().value = user


            //我已阅读并接受
            document.evaluate('/html/body/div[2]/form/div[1]/div[1]/div/div[8]/div[2]/div/label/input', document).iterateNext().click()


            setTimeout(() => {
                //提交按钮
                document.evaluate('/html/body/div[2]/form/div[3]/div/div/div[2]/button', document).iterateNext().click();
            }, 1000)

        }


        await chrome.scripting.executeScript({
            target: {tabId: tab.id},
            function: findAndInputJetbrainsAccount_handle,
            args: [firstName, lastName, userName, user]
        });


        //删除邮箱
        delEmailAccount(user);

        let mail = user + "@" + mailDomain;
        let passwd = user;
        //生成提示
        let tips = textTemplate(`
                    jetbrains 账户,注册完成!!!
                    邮箱: @username@
                    密码: @password@
                `, {
            'username': user + "@" + mailDomain,
            'password': user
        })

        await chrome.scripting.executeScript({
            target: {tabId: tab.id},
            function: (tips, content) => {
                prompt(tips, content);
            },
            args: [tips, mail + "  " + passwd]
        });


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
    const findAndInputEmail_handle = function (email) {
        console.log(email);

        const mail_input = document.evaluate('//*[@id="email"]', document).iterateNext();
        mail_input.value = email

        //点击注册按钮
        setTimeout(() => {
            const btn = document.evaluate('/html/body/div[2]/div[2]/div/div/div[2]/div[2]/form/div[2]/button', document).iterateNext();
            btn.click()
        }, 1000)

    }


    //  执行js
    await chrome.scripting.executeScript({
        target: {tabId: tabId},
        function: findAndInputEmail_handle,
        args: [user + "@" + mailDomain]
    });

    console.log('listen : ' + user);

    //开始接收邮件
    listenEmail(user);

}


main();