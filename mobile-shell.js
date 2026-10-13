(function () {
    'use strict';

    const SHELL_CLASS = 'mobile-shell-ready';
    const DEVICE_ID = 'miniapp-device';

    function getShanghaiTime() {
        return new Intl.DateTimeFormat('zh-CN', {
            timeZone: 'Asia/Shanghai',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
        }).format(new Date());
    }

    function createStatusIcons() {
        const wrapper = document.createElement('div');
        wrapper.className = 'miniapp-status-icons';
        wrapper.setAttribute('aria-hidden', 'true');
        wrapper.innerHTML = `
            <svg viewBox="0 0 18 18" fill="none">
                <path d="M2 14.5v-2.2M5.3 14.5V9.7M8.6 14.5V7.1M11.9 14.5V4.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
            </svg>
            <svg viewBox="0 0 18 18" fill="none">
                <path d="M2.4 7.5a9.3 9.3 0 0 1 13.2 0M4.9 10a5.8 5.8 0 0 1 8.2 0M7.4 12.5a2.3 2.3 0 0 1 3.2 0" stroke="currentColor" stroke-width="1.55" stroke-linecap="round"/>
                <circle cx="9" cy="14.5" r="1" fill="currentColor"/>
            </svg>
            <svg viewBox="0 0 22 18" fill="none">
                <rect x="1.2" y="4.5" width="16" height="9" rx="2.2" stroke="currentColor" stroke-width="1.5"/>
                <path d="M19 7.2v3.6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
                <rect x="3.4" y="6.7" width="10.8" height="4.6" rx="1" fill="currentColor"/>
            </svg>`;
        return wrapper;
    }

    function createBackAction(header) {
        if (!header) return null;

        const backIcon = header.querySelector('path[d*="M15 19l-7-7 7-7"]');
        const backControl = backIcon?.closest('a, button') || Array.from(header.querySelectorAll('a, button')).find(function (element) {
            const id = (element.id || '').toLowerCase();
            const href = element.getAttribute('href') || '';
            const onclick = element.getAttribute('onclick') || '';
            return id.includes('back') || /history\.back|goBack|任务类型选择页|任务列表页/.test(`${href} ${onclick}`);
        });

        if (!backControl) return null;

        return function () {
            const href = backControl.getAttribute('href') || '';
            if (backControl.tagName === 'A' && href && !href.startsWith('javascript:')) {
                window.location.href = href;
                return;
            }
            backControl.click();
        };
    }

    function extractPageHeader(body) {
        const header = body.querySelector('header');
        if (!header) {
            return {
                title: body.dataset.miniProgramTitle || document.title || '邮付管家',
                backAction: null,
            };
        }

        const heading = header.querySelector('h1');
        const title = body.dataset.miniProgramTitle || heading?.textContent?.trim() || document.title || '邮付管家';
        const backAction = createBackAction(header);
        header.remove();

        return { title, backAction };
    }

    function createSystemChrome(title, backAction) {
        const chrome = document.createElement('div');
        chrome.className = 'miniapp-system-chrome';

        const statusBar = document.createElement('div');
        statusBar.className = 'miniapp-status-bar';

        const clock = document.createElement('time');
        clock.className = 'miniapp-clock';
        clock.dateTime = new Date().toISOString();
        clock.textContent = getShanghaiTime();

        statusBar.append(clock, createStatusIcons());

        const navBar = document.createElement('div');
        navBar.className = 'miniapp-nav-bar';

        if (backAction) {
            const backButton = document.createElement('button');
            backButton.className = 'miniapp-back';
            backButton.type = 'button';
            backButton.setAttribute('aria-label', '返回');
            backButton.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M15 19l-7-7 7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>`;
            backButton.addEventListener('click', backAction);
            navBar.appendChild(backButton);
        }

        const titleNode = document.createElement('div');
        titleNode.className = 'miniapp-title';
        titleNode.textContent = title;

        const capsule = document.createElement('button');
        capsule.className = 'miniapp-capsule';
        capsule.type = 'button';
        capsule.tabIndex = -1;
        capsule.setAttribute('aria-label', '小程序菜单');
        capsule.innerHTML = `
            <span class="miniapp-capsule-part">
                <span class="miniapp-capsule-dots"><i></i><i></i><i></i></span>
            </span>
            <span class="miniapp-capsule-divider"></span>
            <span class="miniapp-capsule-part">
                <span class="miniapp-capsule-ring"></span>
            </span>`;

        navBar.append(titleNode, capsule);
        chrome.append(statusBar, navBar);

        window.setInterval(function () {
            const now = new Date();
            clock.dateTime = now.toISOString();
            clock.textContent = getShanghaiTime();
        }, 30000);

        return chrome;
    }

    function initializeMobileShell() {
        if (!document.body || document.getElementById(DEVICE_ID)) {
            return;
        }

        const body = document.body;
        const pageHeader = extractPageHeader(body);
        const originalNodes = Array.from(body.childNodes);

        const stage = document.createElement('div');
        stage.className = 'miniapp-stage';

        const device = document.createElement('section');
        device.className = 'miniapp-device';
        device.id = DEVICE_ID;
        device.setAttribute('aria-label', `${pageHeader.title}小程序预览`);

        const viewport = document.createElement('div');
        viewport.className = 'miniapp-viewport';

        const content = document.createElement('main');
        content.className = 'miniapp-content';
        content.id = 'miniapp-content';

        originalNodes.forEach(function (node) {
            content.appendChild(node);
        });

        viewport.appendChild(content);
        device.append(createSystemChrome(pageHeader.title, pageHeader.backAction), viewport);
        stage.appendChild(device);
        body.appendChild(stage);
        body.classList.add(SHELL_CLASS);

        const observer = new MutationObserver(function (records) {
            records.forEach(function (record) {
                record.addedNodes.forEach(function (node) {
                    // SDK 的脚本、iframe 等临时节点必须保持原父级，供其初始化清理。
                    if (node !== stage && node.parentNode === body && !['SCRIPT', 'IFRAME', 'STYLE', 'LINK'].includes(node.nodeName)) {
                        content.appendChild(node);
                    }
                });
            });
        });
        observer.observe(body, { childList: true });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeMobileShell, { once: true });
    } else {
        initializeMobileShell();
    }
})();
