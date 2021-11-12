let mailDomain = "jpy.wang";


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
 * 找到并输入邮箱
 * @param email
 */
findAndInputEmail = (email) => {
    $(document).ready(function () {
        $($("form")[1]).find("input").val(email);
        setTimeout(() => {
            $($("form")[1]).find("button").click();
        }, 1000);
    });
}


/**
 * 注册输入账号
 */


findAndInputJetbrainsAccount = (firstName, lastName, userName, password, pass2) => {
    $(document).ready(function () {
        //填充表单
        $("#firstName").val(firstName)
        $("#lastName").val(lastName)
        $("input[name='userName']").val(userName)
        $("#password").val(password)
        $("#pass2").val(pass2)

        //我已阅读并接受
        $("input[name='privacy']").prop('checked', true)

        setTimeout(() => {
            //提交按钮
            $('form').find('button').first().click();
        }, 1000)
    });


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
        console.log(await data.text());
    })
}

/**
 * 接收邮件
 * @param user
 * @returns {Promise<void>}
 */
listenEmail = async function ({tabId, user}) {
    console.log('接收邮件:' + user);
    let url = "https://mail.api.jpy.wang/api/receive?username=" + user;

    let ret = null;
    await fetch(url).then(async (data) => {
        let text = await data.text();
        ret = JSON.parse(text)
    })

    if (ret && ret.content && ret.content.length > 0) {
        registerJetbrainsAccount(tabId, user, ret.content);
    } else {
        setTimeout(() => {
            chrome.runtime.sendMessage({
                action: "listenEmail",
                data: {tabId, user}
            });
        }, 3000);
    }
}

/**
 * 邮件的html中取出注册连接
 * @returns {jQuery|*}
 */
mailToJetbrainsUrl = (html) => {
    return $(html).find('a').first().attr('href');
}

/**
 * 开始注册账号
 * @param user
 * @param content
 */
registerJetbrainsAccount = function (tabId, user, content) {
    for (let i in content) {
        let registerJetbrainsMail = content[i].contents[1];

        //在tab中提取出url
        chrome.scripting.executeScript(
            {
                target: {tabId: tabId},
                files: ['./js/jquery-3.6.0.min.js']
            }, () => {
                chrome.scripting.executeScript(
                    {
                        target: {tabId: tabId},
                        func: mailToJetbrainsUrl,
                        args: [
                            registerJetbrainsMail
                        ]
                    }, (data) => {
                        let url = data[0].result;
                        mailToJetbrainsAccount(user, url);
                    })
            }
        );
    }
}


/**
 * 邮件转换为账户
 */
mailToJetbrainsAccount = function (user, url) {
    //打开页面
    chrome.tabs.create({url: url}, function (tab) {
        chrome.runtime.sendMessage({
            "action": "startRegisterJetbrainsAccountWork",
            "data": {"tabId": tab.id}
        }, (ret) => {
            console.log(ret);
        });

    });
}


/**
 * 开始注册
 */
startRegisterAccountWork = async (data) => {
    let tabId = data['tabId']
    //生成邮件
    let user = await makeEmailAccount();

    chrome.scripting.executeScript(
        {
            target: {tabId: tabId},
            files: ['./js/jquery-3.6.0.min.js']
        }, () => {
            chrome.scripting.executeScript(
                {
                    target: {tabId: tabId},
                    func: findAndInputEmail,
                    args: [user + "@" + mailDomain]
                }, () => {
                    console.log('listen : ' + user);
                    // 开始接收邮件
                    chrome.runtime.sendMessage({
                        action: "listenEmail",
                        data: {tabId, user}
                    });
                });
        }
    );


}




startRegisterJetbrainsAccountWork = async (data) => {
    console.log('startRegisterJetbrainsAccountWork', data);
    let tabId = data['tabId'];
    let user = data['user'];
    let firstName = randomLetter(4);
    let lastName = randomLetter(6);
    let userName = randomLetter(6);

    //执行代码
    chrome.scripting.executeScript(
        {
            target: {tabId: tabId},
            files: ['./js/jquery-3.6.0.min.js']
        }, (result) => {
            chrome.scripting.executeScript(
                {
                    target: {tabId: tabId},
                    func: findAndInputJetbrainsAccount,
                    args: [
                        firstName, lastName, userName, user, user
                    ]
                }, (result) => {
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
                    // prompt(tips, mail + "  " + passwd);
                });
        }
    );


}


/**
 * 监听消息
 */
chrome.runtime.onMessage.addListener(function (message, sender, reply) {
    console.log(message)
    let me = this;
    let func = me[message['action']];
    func(message['data']);
});

