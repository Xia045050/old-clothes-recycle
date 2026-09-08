// 项目完整性校验：JSON 合法性、页面四件套、tabBar 图标、WXML 标签配对、JS 语法
// 用法：node scripts/validate.js
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const errors = [];

/* 1. app.json 与页面四件套 */
const app = JSON.parse(fs.readFileSync(path.join(root, 'app.json'), 'utf8'));
for (const p of app.pages) {
  for (const ext of ['.js', '.json', '.wxml', '.wxss']) {
    if (!fs.existsSync(path.join(root, p + ext))) errors.push('缺少页面文件: ' + p + ext);
  }
}
for (const t of app.tabBar.list) {
  for (const k of ['iconPath', 'selectedIconPath']) {
    if (!fs.existsSync(path.join(root, t[k]))) errors.push('缺少图标: ' + t[k]);
  }
  if (!app.pages.includes(t.pagePath)) errors.push('tab 页面未注册: ' + t.pagePath);
}

/* 2/3. 遍历所有文件：JSON 可解析、WXML 标签配对、JS 语法可编译 */
const VOID_TAGS = new Set(['input', 'import', 'include', 'image', 'icon', 'switch', 'slider', 'progress', 'checkbox', 'radio']);

function checkWxml(p) {
  const src = fs.readFileSync(p, 'utf8').replace(/<!--[\s\S]*?-->/g, '');
  const stack = [];
  const re = /<\/?([a-zA-Z][\w-]*)((?:"[^"]*"|'[^']*'|[^"'>])*)>/g;
  let m;
  while ((m = re.exec(src))) {
    const tag = m[1];
    const isClosing = m[0][1] === '/';
    const selfClosed = /\/>$/.test(m[0]);
    if (isClosing) {
      let i = stack.length - 1;
      while (i >= 0 && stack[i] !== tag) i--;
      if (i < 0) {
        errors.push('WXML 标签不匹配 </' + tag + '> in ' + p);
      } else {
        stack.splice(i, 1);
      }
    } else if (!selfClosed && !VOID_TAGS.has(tag)) {
      stack.push(tag);
    }
  }
  if (stack.length) errors.push('WXML 存在未闭合标签 [' + stack.join(',') + '] in ' + p);
}

function walk(dir) {
  for (const f of fs.readdirSync(dir)) {
    const fp = path.join(dir, f);
    const st = fs.statSync(fp);
    if (st.isDirectory()) {
      if (f !== 'node_modules') walk(fp);
      continue;
    }
    if (f.endsWith('.json')) {
      try {
        JSON.parse(fs.readFileSync(fp, 'utf8'));
      } catch (e) {
        errors.push('JSON 解析失败: ' + fp + ' -> ' + e.message);
      }
    } else if (f.endsWith('.wxml')) {
      checkWxml(fp);
    } else if (f.endsWith('.js')) {
      try {
        new vm.Script(fs.readFileSync(fp, 'utf8'), { filename: fp });
      } catch (e) {
        errors.push('JS 语法错误: ' + fp + ' -> ' + e.message);
      }
    }
  }
}
walk(root);

if (errors.length) {
  console.log('发现问题 ' + errors.length + ' 个:');
  errors.forEach(e => console.log('  ✗ ' + e));
  process.exit(1);
} else {
  console.log('校验通过: ' + app.pages.length + ' 个页面, tabBar ' + app.tabBar.list.length + ' 项, 所有 JSON/WXML/JS 均正常');
}
