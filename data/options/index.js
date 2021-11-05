'use strict';

const toast = document.getElementById('toast');

document.getElementById('save').addEventListener('click', () => {

  {
    const list = document.getElementById('list').value
      .split(',')
      .map(s => s.trim())
      .map(s => s.startsWith('http') || s.startsWith('ftp') ? (new URL(s)).hostname : s)
      .filter((h, i, l) => h && l.indexOf(h) === i);
    localStorage.setItem('list', JSON.stringify(list));
    document.getElementById('list').value = list.join(', ');
    // update preference
    chrome.runtime.getBackgroundPage(bg => {
      bg.list = list;
    });
  }

  toast.textContent = '保存成功';
  window.setTimeout(() => toast.textContent = '', 750);
});

// reset
document.getElementById('reset').addEventListener('click', e => {
  localStorage.clear();
  chrome.storage.local.clear(() => {
    chrome.runtime.reload();
    // toast.textContent = '初始化完成';
    setInterval(()=>{
      window.close();
    },500)
  });

});
// support
// document.getElementById('support').addEventListener('click', () => chrome.tabs.create({
//   url: chrome.runtime.getManifest().homepage_url + '?rd=donate'
// }));




document.getElementById('list').value = JSON.parse(localStorage.getItem('list') || '[]').join(', ');

