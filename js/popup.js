let account_jetbrains = async function () {
    let account_jetbrains_elm = document.getElementById('account_jetbrains');
    account_jetbrains_elm.addEventListener('click', async function () {
        chrome.runtime.sendMessage(
            {action: "start_task"}, // 你想让 background 执行的动作
            function (response) {
                console.log("后台返回：", response.result);
                window.close();
            }
        );
    }, false);
}


document.addEventListener('DOMContentLoaded', function () {
    //异步
    account_jetbrains();
});
