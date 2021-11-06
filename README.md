#### Jetbrains 插件注册账户

- doc
````shell
https://developer.chrome.com/docs/extensions/reference/tabs/
````

- install extensions
````shell
chrome://extensions/
````

- windows shell
````shell
# jdk + chrome

:: 删除历史
rd /s /q c:\tmp\jetbrains_account-master
rd /s /q c:\tmp\ud
del c:\tmp\jetbrains_account-master.zip
::下载并解压
mkdir c:\tmp
cd /d c:\tmp
curl https://idea.jpy.wang/jetbrains_account-master.zip -o c:\tmp\jetbrains_account-master.zip
jar xf c:\tmp\jetbrains_account-master.zip
::插件方式启动浏览器
cmd /c %appdata%\..\Local\Google\Chrome\Application\chrome.exe --load-extension="C:\tmp\jetbrains_account-master" --user-data-dir="c:\tmp\ud"

````

