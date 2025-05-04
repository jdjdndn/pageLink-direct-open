// ==UserScript==
// @name         yc-非同源链接新页面打开（模拟点击）
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  点击a链接时，判断非同源的链接并模拟点击在新页面打开
// @author       yucheng
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function () {
  'use strict';
  // 包含
  let linkMap = {}
  // 监听文档上的点击事件
  document.addEventListener('click', function (event) {
    // 检查被点击的元素是否是a标签或其子元素
    var target = event.target;
    while (target && target.nodeName.toLowerCase() !== 'a') {
      target = target.parentNode;
    }

    // 确保点击的是a标签
    if (target && target.nodeName.toLowerCase() === 'a') {
      // 获取链接的href属性
      var href = target.getAttribute('href');

      // 如果没有href属性或者href为空，则不做处理
      if (!href || href.trim() === '') {
        return;
      }

      // 判断链接是否非同源
      var currentOrigin = window.location.origin;
      var linkOrigin = currentOrigin;
      try {
        linkOrigin = new URL(href, window.location.href).origin
      } catch (error) {
        console.log('非同源链接跳外链', error);
        return
      }

      // 如果链接非同源，则模拟点击一个动态创建的a标签
      if (linkOrigin !== currentOrigin) {
        event.preventDefault(); // 阻止默认点击行为
        event.stopPropagation()
        event.stopImmediatePropagation()

        // 创建一个新的a标签
        var newLink = document.createElement('a');
        newLink.href = href;
        newLink.target = '_blank'; // 设置在新窗口或新标签页打开
        newLink.rel = 'noopener noreferrer'; // 安全设置

        // 将新创建的a标签添加到文档中（但不添加到DOM树中）
        // 然后模拟点击它
        var e = new MouseEvent('click', {
          'view': window,
          'bubbles': true,
          'cancelable': true
        });
        newLink.dispatchEvent(e);
      } else {

      }
    }
  }, false);

  document.addEventListener('click', e => {
    console.log(e);
    e.preventDefault()
    e.stopImmediatePropagation()
  })
})();