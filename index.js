// ==UserScript==
// @name         链接新页面打开
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  监听页面节点和属性变化，为非同源且未设置为新页面打开的a链接添加target='_blank'
// @author       yucheng
// @match        *://*/*
// @grant        none
// @run-at      document-idle
// ==/UserScript==

(function () {
  'use strict';
  // 节流函数，限制函数执行频率
  function throttle(func, delay) {
    let lastCall = 0;
    return function (...args) {
      const now = new Date().getTime();
      if (now - lastCall < delay) {
        return;
      }
      lastCall = now;
      return func.apply(this, args);
    };
  }

  //如果链接的pathname只有一个单词，那么就过滤掉，多个单词允许跳转
  function filterShortestPathnames(anchors) {
    anchors.forEach(anchor => {
      if (anchor.target === '_blank') return
      const pathname = anchor.pathname
      if (!pathname) return
      if (pathname.split('/').length > 2) {
        anchor.target = '_blank'
        anchor.rel = 'noopener noreferrer';
      }
    })
  }
  // 如果多个链接search中有重复的key,就允许跳转
  function searchFilterKey(anchors) {
    const map = {}
    anchors.forEach(anchor => {
      if (anchor.search) {
        const params = new URLSearchParams(anchor.search);
        // 遍历所有参数名并添加到Set中
        for (const key of params.keys()) {
          if (map[key]) {
            map[key]++
          } else {
            map[key] = 1
          }
        }
      }
    })
    for (const key in map) {
      if (map[key] <= 1) {
        delete map[key]
      }
    }
    for (const key in map) {
      anchors.forEach(anchor => {
        if (anchor.search.includes(key) && !anchor.target) {
          anchor.target = '_blank'
          anchor.rel = 'noopener noreferrer';
        }
      })
    }
  }
  // 修改链接的函数
  function updateLinks() {
    const anchors = document.querySelectorAll('a[href]:not([target=_blank])');
    filterShortestPathnames(anchors)
    searchFilterKey(anchors)

    anchors.forEach(function (anchor) {
      const host = anchor.host
      // 判断链接是否非同源且未设置target='_blank'

      // 判断链接是否非同源
      if (host && !window.location.origin.includes(host)) {
        // 设置target='_blank'和rel='noopener noreferrer'
        anchor.target = '_blank';
        anchor.rel = 'noopener noreferrer';
      }

    });
  }

  // Object.keys(getEventListeners(window)).forEach(eName => {
  //   if (eName.includes('point') || eName.includes('mouse')) return
  //   window.addEventListener(eName, e => { console.log(eName) })
  // })

  // function getListGroup(node) {
  //   function getGroup(node) {
  //     if (!node) return
  //     if (node.nodeName === 'A') {
  //       node.target = '_blank'
  //     }
  //     if (node.shadowRoot) {
  //       const shadowRoot = node.shadowRoot
  //       const shadowChildLen = shadowRoot.childNodes.length
  //       for (let i = 0; i < shadowChildLen; i++) {
  //         getGroup(shadowRoot.childNodes[i])
  //       }
  //     }
  //     if (!node.children || !node.children.length) return
  //     const nodeChildLen = node.children.length
  //     for (let i = 0; i < nodeChildLen; i++) {
  //       getGroup(node.children[i])
  //     }
  //   }
  //   getGroup(node)
  // }

  // 创建一个MutationObserver实例，用于监听DOM变化
  const observer = new MutationObserver(throttle(updateLinks, 200)); // 200毫秒节流

  // 配置观察器选项
  const config = {
    attributes: true, // 监听属性变化
    childList: true,  // 监听子节点变化
    // subtree: true     // 监听子孙节点变化
  };

  // 开始观察目标节点，这里是整个document
  observer.observe(document.body, config);

  // 首次运行函数，确保已存在的链接也被处理
  // updateLinks();
})();