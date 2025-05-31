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
  // 该标记元素a链接不设置target
  const NO_TARGET = 'no-target'

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
      // 根据一个a链接，找他的父亲的子元素有没有多个a链接，没有就继续往上找，直到找到那个父亲并return
      function findCommonParent(anchor, fn) {
        let current = anchor.parentElement;
        while (current && current !== document.body) {
          const anchorCount = current.querySelectorAll('a[href]:not([target=_blank]):not([text-link])').length;
          if (anchorCount > 1) {
            break // 找到包含多个 <a> 的父节点
          }
          current = current.parentElement; // 向上继续查找
        }
        const links = [...current.querySelectorAll('a[href]:not([target=_blank]):not([text-link])')]
        const flag = links.find(link => link !== anchor && link.innerText !== '' && Number(link.innerText) === Number(link.innerText))
        fn(links)
        return flag ? current : null; // 没有找到符合条件的父节点
      }
      let parent = null
      if (anchor.innerText !== '' && Number(anchor.innerText) === Number(anchor.innerText)) {
        parent = findCommonParent(anchor, links => {
          links.forEach(link => link.setAttribute(NO_TARGET, true))
        })
        if (parent) {
          parent.setAttribute(NO_TARGET, true)
        }
      }
      if (anchor.target || !anchor.pathname.startsWith('/') || anchor.pathname.length <= 1 || anchor.getAttribute(NO_TARGET)) return

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
        if (anchor.getAttribute(NO_TARGET)) return
        if (anchor.search.includes(key) && !anchor.target) {
          anchor.target = '_blank'
          anchor.rel = 'noopener noreferrer';
        }
      })
    }
  }
  // 修改链接的函数
  function updateLinks() {
    const anchors = document.querySelectorAll(`a[href]:not([target=_blank]):not([text-link])`);
    filterShortestPathnames(anchors)
    searchFilterKey(anchors)

    anchors.forEach(function (anchor) {
      if (anchor.getAttribute(NO_TARGET)) return
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