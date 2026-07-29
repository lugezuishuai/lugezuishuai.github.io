---
title: React 服务端渲染原理与实践
date: 2025-09-09 10:00:00
tags:
  - React
categories:
  - [React]
featured_image: ./cover.jpg
---

# 什么是服务端渲染

服务端渲染， SSR (Server-side Rendering) ，顾名思义，就是在浏览器发起页面请求后由服务端完成页面的HTML结构拼接，返回给浏览器解析后能直接构建出**有内容**的页面。

首先，我们先来回顾下页面渲染方式的发展历程。

## 传统的 SSR

> 传统的SSR也称后端模板渲染，最常见的就是jsp和php。服务端在收到客户端的页面请求后，使用模板引擎将页面模板与数据拼接成HTML进行返回。客户端接收到响应数据后能直接渲染展示，但后续的一些交互性的东西还是需要经过js去操作dom来实现。

![流程图](./whiteboard-01.jpg)

## CSR

> CSR是客户端渲染，服务端收到客户端请求后，只会返回无页面内容的HTML。需要客户端另外自行加载执行JS，完成页面渲染。若需要页面首屏数据时，再去请求服务端，获取最新数据，更新视图。

![流程图](./whiteboard-02.jpg)

## 同构的 SSR

> 所谓同构，就是在SPA应用的基础上（这里默认同构应用也是SPA），同一份代码，在服务端执行一次，生成首屏HTML和CSR脚本；再在客户端执行一次，将应用交互所需的数据、事件等绑定到HTML上，完成应用的加载，后续仍是传统SPA应用的加载模式。

![流程图](./whiteboard-03.jpg)

得益于 Virtual DOM 和 Node 的存在，才能实现同构的服务端渲染。由于同构的 SSR 项目代码会在服务端和客户端分别执行一次，Node 提供了天然的 JavaScript 运行环境；在 Node 环境下，不能直接操作 DOM，但是由于 Virtual DOM 的存在，可以在 Node 环境下操作 Virtual DOM 生成 HTML。

React 的服务端渲染也是同构的服务端渲染的一种，本文接下来介绍的内容都是同构的服务端渲染。

# 为什么使用服务端渲染

上面介绍了同构的服务端渲染流程，现在来考虑一下我们为什么要用服务端渲染，什么场景下适合用服务端渲染。

## 服务端渲染的优势

相比于客户端渲染，服务端渲染主要有以下两个优势：

- **首屏时间更短**采用客户端渲染的页面，要进行JS文件拉取和JS代码执行，动态创建 DOM 结构，客户端逻辑越重，初始化需要执行的 JS 越多，首屏性能就越慢；客户端渲染前置的第三方类库/框架、polyfill 等都会在一定程度上拖慢首屏性能。Code splitting、lazy-load等优化措施能够缓解一部分，但优化空间相对有限。相比而言，服务端渲染的页面直接拉取HTMl就能显示内容，更短的首屏时间创造更多的可能性。
- **更好的 SEO**在别人使用搜索引擎搜索相关的内容时，你的网页排行能靠得更前，这样你的流量就有越高，这就是SEO的意义所在。那为什么服务端渲染更利于爬虫爬你的页面呢？因为对于很多搜索引擎爬虫（非google）HTML返回是什么内容就爬什么内容，而不会动态执行JS代码内容。对客户端渲染的页面来说，简直无能为力，因为返回的HTML是一个空壳。而服务端渲染返回的HTML是有内容的。

## 和 CSR 的性能对比

首先，我们先看一下以下几个网页性能指标

- **TTFB（Time To First Byte）**：客户端发起网络请求到接收到从服务器返回的第一个字节的时间（网络响应时间）
- **FP（First Paint）**：从页面加载开始到浏览器首次渲染任何内容到屏幕上的时间（页面开始渲染时间）
- **FCP（First Contentful Paint）**：从用户发起页面加载到浏览器渲染页面上首个“内容”元素的时间（首屏渲染时间）
- **TTI（Time To Interactive）**：从页面开始加载到达到完全可交互状态所需要的时间（页面可交互时间）

SSR**可能在TTFB上比CSR更慢**，因为服务端需要渲染和准备当前请求的HTML，而CSR只需要直接传HTML和JS即可；但后续**FP和FCP都会显著快于CSR**，因为服务端本地渲染HTML会比客户端渲染更快，且客户端拿到HTML后就可以立刻渲染而无需等待JS加载完成。

![流程图](./whiteboard-04.jpg)

## 服务端渲染的弊端

从上面分析可以看出，相比客户端渲染，服务端渲染有两大优势：**首屏快和利于SEO**，但是服务端渲染也是有一定弊端的。

服务端渲染的弊端主要体现在以下两个方面：

- **代码复杂度增加**：为了实现服务端渲染，应用代码中需要兼容服务端和客户端两种运行环境，部分代码需要区分服务端和客户端，相较于客户端渲染对代码的复杂度要求较高
- **服务器负载增加**：服务端渲染需要服务器动态生成HTML，对服务器的CPU和内存使用增加了负担，尤其是在高流量的情况下可能需要更多的服务器资源

## 适合使用服务端渲染的场景

- **SEO优化**：对于搜索引擎优化（SEO）非常重要的应用，如博客、新闻网站、电子商务平台等，使用SSR可以确保搜索引擎能够索引到内容丰富的页面，因为内容在服务器端就已经被填充，并以完整的HTML形式提供给抓取工具。
- **首屏加载性能**：对于首屏加载性能高的应用，如商城、文档、新闻等，此类应用属于内容密集型应用，使用SSR可以提高网站的FCP，更快地渲染出首屏内容。

# React 服务端渲染原理

## 核心思想

React 服务端渲染的**核心思想就是同构**，一份代码分别打包出供服务端和客户端运行的两份js产物。服务端渲染出了首屏内容后，客户端 hydrate 渲染复用服务端返回的DOM节点，进行一次类似于 render 的 hydrate 渲染过程（不会销毁重建DOM节点），把交互事件绑定到DOM节点上（此时页面可交互），并接管页面。

![流程图](./whiteboard-05.jpg)

服务端渲染返回的

![图片展示了一箱包装好的鱼，鱼头被塑料袋包裹，露出类似人头的面部特征。图片位于介绍React服务端渲染原理中“核心思想”部分，用于形象地说明服务端渲染返回的页面内容，即“服务端渲染返回的页面内容是固定的，不会根据用户操作而变化”。](./image-01.jpg)

客户端注水后的

![图片展示了一只蓝点魟在水族馆的场景。蓝点魟身体呈淡灰色，身上布满蓝色的斑点，尾部细长，游动时尾部展开。它位于水族馆的沙质海底，周围有珊瑚礁等水下环境。图片与文档中React服务端渲染原理部分内容相关，可能用于说明或比喻某些概念，但具体关联需结合上下文理解。](./image-02.jpg)

## 生命周期

SSR过程中组件的生命周期是不完整的，只能执行到render及之前的生命周期（constructor、getDerivedStateFromProps、render），commit阶段的生命周期不会执行。

在编写代码时，需要避免在render及之前的生命周期中使用浏览器相关的API（history、document、window等），如果实在需要使用则需加上环境判断；同时，需要避免在全局定义任何可能不断增长的数据结构，或在全局进行事件订阅，或创建不会被销毁的流，会造成内存泄漏的风险。

![图片展示了React组件生命周期的流程图。其中，“Mounting”阶段以红色框突出显示，包含constructor等生命周期方法；“Updating”阶段有新props、setState等操作；“Unmounting”阶段有componentWillUnmount方法。该图与上下文紧密相关，上下文提到SSR过程中组件生命周期不完整，只能执行到render及之前的生命周期，此图直观呈现了这一生命周期流程，帮助理解React组件在不同阶段的运行情况。](./image-03.jpg)

## 服务端渲染 API

React 服务端渲染主要依赖于 react-dom/server 包中的几个API和 react-dom 中的 hydrate（<= React 17）和hydrateRoot（React 18）API。

### renderToString

> https://zh-hans.react.dev/reference/react-dom/server/renderToString

<callout emoji="💡">
`renderToString` 不支持流式传输或等待数据。
</callout>

`renderToString`将React树渲染为一个HTML字符串，需要配合客户端的`hydrateRoot`API使用，使应用变得可交互。

### renderToStaticMackup

> https://zh-hans.react.dev/reference/react-dom/server/renderToStaticMarkup

<callout emoji="💡">
`renderToStaticMarkup`输出的HTML无法进行二次渲染（不能使应用变得可交互）
</callout>

`renderToStaticMarkup`和`renderToString`类似，也是将React树渲染为HTML字符串，两者最大的区别是`renderToString`输出的HTML可以被`hydrateRoot`二次渲染，变得可交互；而`renderToStaticMarkup`输出的是静态的HTML，无法二次渲染。

### renderToPipeableStream

> https://zh-hans.react.dev/reference/react-dom/server/renderToPipeableStream

`renderToPipeableStream` 是React18新增的API，将一个 React 组件树渲染为管道化（pipeable）的 [Node.js 流](https://nodejs.org/api/stream.html)。通常配合`Suspense`使用，实现流式渲染。

### hydrateRoot

> https://zh-hans.react.dev/reference/react-dom/client/hydrateRoot

<callout emoji="💡">
`hydrateRoot` 期望服务端返回的 HTML 和客户端渲染的结构完全相同，但是当服务端返回的 HTML 与客户端渲染结果不一致时，出于性能考虑，hydrateRoot可以弥补文本内容的差异，但并不能保证修补属性的差异，而是将错就错；只在development模式下对这些不一致的问题报 Warning，因此必须重视 SSR HydrationWarning，要当 Error 逐个解决。
</callout>

`hydrateRoot`方法能在客户端初次渲染的时候去**复用服务端返回的原本已经存在的 DOM 节点，于渲染过程中为其附加交互行为（事件监听等），而不是重新创建 DOM 节点**。

在开发模式下，如果出现服务端返回的 HTML 和客户端渲染的结果不一致时，会出现 Warning 或者 Error，主要分为以下几种情况：

- **React 节点属性不一致**

<table><colgroup><col/><col/></colgroup><tbody><tr><td>HTML</td><td>App.tsx</td></tr><tr><td><pre lang="HTML"><code>&lt;!--<br/>  在 &lt;div id="root"&gt;...&lt;/div&gt; 中的 HTML 内容<br/>  由 react-dom/server 生成<br/>--&gt;<br/>&lt;div id="root"&gt;&lt;h1&gt;Hello, world!&lt;/h1&gt;&lt;/div&gt;</code></pre></td><td><pre lang="TypeScript"><code>import { hydrateRoot } from "react-dom/client";<br/><br/>function App() {<br/>  return &lt;h1 style={{ fontWeight: 600, fontSize: 30 }}&gt;Hello, world!&lt;/h1&gt;;<br/>}<br/><br/>hydrateRoot(document.getElementById("root"), &lt;App /&gt;);<br/></code></pre></td></tr></tbody></table>

会出现 Warning 提示，客户端可以渲染但是不会修补属性的差异，可以通过设置`suppressHydrationWarning`属性为true忽略掉 Warning 提示（但是不会修补）（强烈不建议）。

![图片展示的是React服务端渲染中React节点属性不一致时出现的Warning提示。内容为“Warning: Prop `style` did not match. Server: "null" Client: "font-weight:600; font-size:30px"”，并显示了错误发生在`h1`和`App`组件处。该图片与文档中介绍的在开发模式下，服务端返回的HTML和客户端渲染结果不一致时，若出现React节点属性不一致情况，会出现Warning提示的内容相关，直观呈现了Warning提示样式。](./image-04.png)

![图片展示了浏览器开发者工具中Elements标签页下的HTML代码视图。画面中高亮显示了`<h1>Hello, world!</h1>`元素，其右侧有“element.style {”字样，表明可对元素样式进行操作。该图片与文档中“React节点属性不一致”部分内容相关，用于说明在开发模式下，若服务端返回的HTML和客户端渲染结果不一致，会出现Warning提示，可通过设置`suppressHydrationWarning`属性为true忽略该提示，但不修补属性差异，此图直观呈现了HTML代码中元素样式操作的场景。](./image-05.png)

- **React 节点文本内容不一致**

<table><colgroup><col/><col/></colgroup><tbody><tr><td>HTML</td><td>App.tsx</td></tr><tr><td><pre lang="HTML"><code>&lt;!--<br/>  在 &lt;div id="root"&gt;...&lt;/div&gt; 中的 HTML 内容<br/>  由 react-dom/server 生成<br/>--&gt;<br/>&lt;div id="root"&gt;&lt;h1&gt;Hello, world!&lt;/h1&gt;&lt;/div&gt;</code></pre></td><td><pre lang="TypeScript"><code>import { hydrateRoot } from "react-dom/client";<br/><br/>function App() {<br/>  return &lt;h1&gt;Hello, world Client!&lt;/h1&gt;;<br/>}<br/><br/>hydrateRoot(document.getElementById("root"), &lt;App /&gt;);<br/></code></pre></td></tr></tbody></table>

会出现 Error 提示，并导致 hydrateRoot 失败，可以通过设置`suppressHydrationWarning`属性为true使客户端尝试修补文本内容的不一致（强烈不建议）。

![图片展示的是React服务端渲染过程中出现的错误提示。内容为“Uncaught Error: Text content does not match server-rendered HTML.”，并列出了多个调用栈信息，如`checkForUnmatchedText`、`diffHydratedProperties`等函数。该图片与文档中“React节点文本内容不一致”部分内容相关，用于直观呈现因文本内容不一致导致的Error提示，帮助理解hydrateRoot失败时可能出现的问题。](./image-06.png)

![图片展示的是React服务端渲染中React节点文本内容不一致时出现的错误提示。画面中显示“1 of 2 errors on the page”及“Error”字样，下方提示“Text content does not match server-rendered HTML”，并说明有13个堆栈帧被折叠。该图片与文档中介绍的React服务端渲染问题相关，直观呈现了当React节点文本内容不一致时，客户端尝试修补文本内容不一致失败后，会弹出的错误提示界面。](./image-07.png)

- **React DOM 树结构不一致**

<table><colgroup><col/><col/></colgroup><tbody><tr><td>HTML</td><td>App.tsx</td></tr><tr><td><pre lang="HTML"><code>&lt;!--<br/>  在 &lt;div id="root"&gt;...&lt;/div&gt; 中的 HTML 内容<br/>  由 react-dom/server 生成<br/>--&gt;<br/>&lt;div id="root"&gt;&lt;h1&gt;Hello, world!&lt;/h1&gt;&lt;/div&gt;</code></pre></td><td><pre lang="TypeScript"><code>import { hydrateRoot } from "react-dom/client";<br/><br/>function App() {<br/>  return (<br/>    &lt;&gt;<br/>      &lt;h1&gt;Hello, world!&lt;/h1&gt;<br/>      &lt;h2&gt;Unexpected&lt;/h2&gt;<br/>    &lt;/&gt;<br/>  );<br/>}<br/><br/>hydrateRoot(document.getElementById("root"), &lt;App /&gt;);<br/></code></pre></td></tr></tbody></table>

会出现 Error 提示，并导致 hydrateRoot 失败。

![图片展示的是React服务端渲染过程中出现的错误提示。错误信息为“Hydration failed because the initial UI does not match what was rendered on the server”，并列出了错误抛出的多个函数位置，如`throwOnHydrationMismatch`、`tryToClaimNextHydratableInstance`等。该图片与上下文紧密相关，上下文在介绍React服务端渲染时，提到会出现Error提示导致hydrateRoot失败的情况，此图直观呈现了该错误的具体表现形式。](./image-08.png)

![图片展示的是React服务端渲染中出现的Hydration失败提示。页面显示“1 of 3 errors on the page”及“Error”字样，具体内容为“Hydration failed because the initial UI does not match what was rendered on the server.”，并说明有15个堆栈帧被折叠。该图片与文档中“React DOM树结构不一致”部分对应，用于直观呈现因DOM结构不一致导致的Hydration失败情况，帮助理解React服务端渲染时可能出现的错误提示。](./image-09.png)

## Streaming SSR

> 官方demo：https://codesandbox.io/s/kind-sammet-j56ro?file=/src/App.js

在 React 18 之前的版本的 SSR 有一些弊端：

- 服务端需要准备好所有组件的 HTML 才能返回。如果某个组件需要的数据耗时较久，就会阻塞整个 HTML 的生成。
- Hydration 是一次性的，用户需要等待客户端加载所有组件的 JavaScript 并 Hydrated 完成后才能和任一组件交互。（渲染逻辑复杂时，页面首次渲染到可交互之间可能存在较长的不可交互时间）
- 在 React SSR 中不支持客户端渲染常用的代码分割组合`React.lazy`和`Suspense`。

而在 React 18 中新的 SSR 架构[React Fizz](https://link.juejin.cn/?target=https%3A%2F%2Fgithub.com%2Ffacebook%2Freact%2Fpull%2F14144)带来了两个主要新特性来解决上述的缺陷：**Streaming HTML**（流式渲染）和**Selective Hydration**（选择性注水）

### **流式渲染（Streaming HTML）**

一般来说，流式渲染就是把 HTML 分块通过网络传输，然后客户端收到分块后逐步渲染，提升页面打开时的用户体验。通常是利用`HTTP/1.1`中的[分块传输编码](https://link.juejin.cn/?target=https%3A%2F%2Fbaike.baidu.com%2Fitem%2F%25E5%2588%2586%25E5%259D%2597%25E4%25BC%25A0%25E8%25BE%2593%25E7%25BC%2596%25E7%25A0%2581)（Chunked transfer encoding）机制。

React 18 推出了新的服务端渲染 API [renderToPipeableStream](https://zh-hans.react.dev/reference/react-dom/server/renderToPipeableStream)，结合 [Suspense](https://zh-hans.react.dev/reference/react/Suspense) 可以实现流式渲染。实现的效果如下图：

![图片展示了React服务端渲染流式渲染的效果示意图。画面中有一个大矩形框架，框架内有三个矩形区域，左侧一个竖直矩形，右侧两个水平矩形。框架底部有一个发光的太阳图案。该图与上文提到的React 18推出的新服务端渲染API `renderToPipeableStream` 结合Suspense实现流式渲染的内容相关，直观呈现了流式渲染时页面加载的层次感。](./image-10.png)

### **选择性注水 （Selective Hydration）**

有了`lazy`和`Suspense`的支持，另一个特性就是 **React SSR 能够尽早对已经就绪的页面部分注水，而不会被其他部分阻塞**。

这样就可以将不需要同步加载的组件选择性地用`lazy`和`Suspense`包起来（和客户端渲染时一样）。而 React 注水的粒度取决于`Suspense`包含的范围，每一层`Suspense`就是一次注水的“层级”（要么组件都完成注水要么都没完成）。

同样的，流式传输的 HTML 也不会阻塞注水过程。如果 JavaScript 早于 HTML 加载完成，React 就会开始对已完成的 HTML 部分注水。

React 通过维护几个优先队列，能够记录用户的交互点击来优先给对应组件注水，在注水完成后组件就会响应这次交互，即事件重放（event replay）。

![图片展示了React流式服务端渲染（SSR）中选择性注水（Selective Hydration）的示例。画面中左侧有一个被橙色箭头指向的“click!”按钮，右侧下方区域显示“hydrating...”字样。该图与文档中介绍React注水粒度取决于`Suspense`包含范围，以及通过维护优先队列记录用户交互点击优先注水的内容相关，直观呈现了点击按钮后组件开始注水的场景。](./image-11.jpg)

# 最佳实践

以下内容使用实际举例，结合实际代码讲述如何不依赖现成的SSR框架（Next、Edenx等）实现一个完整的SSR应用，加深对React SSR的理解。

## SSR 技术栈

![流程图](./whiteboard-06.jpg)

## 流程

主要分为**构建**和**运行时**两个主流程

![流程图](./whiteboard-07.jpg)

## 构建

构建这一块用的是基于Rust编写的构建工具 [Rsbuild](https://rsbuild.dev/zh/guide/start/) 。通常，SSR应用需要构建出两份产物，除了客户端执行的产物外，还需要构建出给Node执行的产物。相比于客户端执行的产物，Node执行的产物有如下几点差异：

- 只需要构建出js资源，不需要包含css、html、img等资源
- 不需要拆包，打包成一个完整的js文件
- 将js编译成commonjs模块
- 【可选】js不需要压缩

### Rsbuild 配置

[Rsbuild](https://rsbuild.dev/zh/guide/start/) 是由 [Rspack](https://rspack.dev/) 驱动的高性能构建工具，它默认包含了一套精心设计的构建配置，提供开箱即用的开发体验，并能够充分发挥出 Rspack 的性能优势。

主要的构建配置如下：

```TypeScript
import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginSvgr } from '@rsbuild/plugin-svgr';
import { pluginYaml } from '@rsbuild/plugin-yaml';
import { isEnvProduction, srcPath, publicPath, themePath, isNodeTarget, isSSRDev } from './config/constant';
import template from './config/template';

export default defineConfig({
  source: {
    entry: {
      index: isNodeTarget ? './src/index' : './src/index.web', // 区分web环境和node环境构建的入口
    },
    // ...
  },
  output: {
    assetPrefix: isNodeTarget ? '/' : 'auto', // node环境设置成根路径，web环境设置为auto，服务端动态下发publicPath，在运行时通过__webpack_public_path__设置
    overrideBrowserslist: isNodeTarget // node环境下不参考.browserslistrc文件，设置node的范围
      ? {
          node: ['node >= 18'],
        }
      : undefined,
    targets: isNodeTarget ? ['node'] : ['web'], // target根据构建产物区分
    minify: isEnvProduction && !isNodeTarget, // dev模式和node产物不需要压缩和混淆
    // ...
  },
  html: isNodeTarget // node产物不需要输出html文件
    ? undefined
    : {
        inject: true,
        template: './public/index.html',
        favicon: './public/favicon.png',
        title: 'API Meta',
        // 注入一些变量
        templateParameters: {
          headerInjects: template.header,
          bodyInjects: template.body,
          env: process.env.NODE_ENV,
        },
      },
  tools: {
    rspack: {
      resolve: {
        mainFields: isNodeTarget ? ['module', 'main'] : ['browser', 'module', 'main'], // 构建node产物忽略掉browser的入口
      },
      // ...
    },
  },
  // ...
});

```

### 构建脚本

由于 BFF和web端不是同一个应用，在构建过程中需要将node服务和web端应用分开构建，需要将web端构建的node产物和html模版上传到node服务器中，将客户端产物上传到CDN中。

```Bash
#!/bin/bash

# exit immediately if pipeline/list/(compound command) returns non-zero status
# reference https://www.gnu.org/software/bash/manual/bash.html#The-Set-Builtin
set -e
source /etc/profile
echo "node version is $(node -v)"

# 设置 npm 镜像
npm config set registry https://bnpm.byted.org/

# 安装依赖
node common/scripts/install-run-rush.js install --bypass-policy

rm -rf output
rm -rf output_resource

mkdir -p output
mkdir -p output_resource/console
mkdir -p output_resource/doc

# 服务端 构建
node common/scripts/install-run-rush.js build -t @lark-meta/bff --verbose

# 生成目标文件
node common/scripts/install-run-rush.js deploy -p @lark-meta/bff -t output -s bff --overwrite
mv -f output/app/bff/output/* output/app/bff
rm -rf output/app/bff/output

# console构建
node common/scripts/install-run-rush.js build -t @lark-meta/console --verbose

mv ./app/frontend/dist/index.html ./output/app/bff/views/index.handlebars
mv ./app/frontend/dist/* ./output_resource/console

# doc构建
node common/scripts/install-run-rush.js build -t @lark-meta/doc --verbose

# 产物上传（用户服务端的产物和html模版上传到服务器,客户端资源上传到CDN）
mv ./app/doc/dist/server/index.js ./output/app/bff/document.ssr.js
mv ./app/doc/dist/index.html ./output/app/bff/views/doc.handlebars
mv ./app/doc/dist/* ./output_resource/doc

# 生成 manifest 文件
cd output/app/bff
npm run manifest

```

## 运行时

同一份代码需要同时支持在node和web环境中运行，涉及到代码运行时的同构，其中主要分为**路由同构**、**数据同构**和**渲染同构**三大部分。

### 路由同构

无论是服务端还是客户端，都是在用户发起请求时进行路由匹配，执行相应的路由逻辑（接口响应/渲染组件）。但是双端的路由匹配原理是不同的。

- 服务端：通过请求路径匹配相应的中间件进行返回
- 客户端：根据浏览器路径通过react-router匹配对应的路由组件并渲染

我们需要将同一份路由规则抽出，分别在服务端和客户端运行，这就是路由的同构。其中又分为**数据路由**和**非数据路由**。

#### 非数据路由

> 详细可参考：https://reactrouter.com/en/main/guides/ssr#without-a-data-router

顾名思义，非数据路由就是在渲染路由组件前不需要额外的数据请求。

先抽离通用的路由表 routes.tsx

```TypeScript
import React from 'react';
import { Navigate, RouteObject } from 'react-router-dom';
import { Document } from './pages/document';
import { Layout } from '@lark-meta/components';
import { RPC_LIST_KEY } from '@lark-meta/utils';

export const routes: RouteObject[] = [
  {
    path: '/axe/document',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Navigate to={RPC_LIST_KEY} replace />, // 输入/axe/document重定向到/axe/document/rpcApiList
      },
      {
        path: '*',
        element: <Document />,
      },
    ],
  },
];

```

服务端需要使用`StaticRouter`匹配路由，需要手动传递`location`；客户端需要使用`BrowserRouter`。

- 服务端 app.tsx

```TypeScript
import React from 'react';
import { StaticRouter } from 'react-router-dom/server';
import { HTTPRequest } from '@gulux/gulux/lib/exports/application-http';
import { ConfigProvider as UDConfigProvider, FloatingUIPopperSidecar } from '@universe-design/react';
import zhCN from '@universe-design/react/es/shared/locales/zh-CN';
import type { Router, StaticHandlerContext } from '@remix-run/router';
import { GlobalProvider } from './components/provider';
import { CurrentUser } from '@lark-meta/types';
import { useRoutes } from 'react-router';
import { routes } from './routes';

interface AppProps {
  req: HTTPRequest;
  router: Router;
  context: StaticHandlerContext;
  profile?: CurrentUser;
}

export function App(props: AppProps) {
  const router = useRoutes(routes);
  const { context, req, profile } = props;

  return (
    <GlobalProvider req={req} profile={profile} path={req.path}>
      <UDConfigProvider locale={zhCN} PopperSidecar={FloatingUIPopperSidecar}>
        <StaticRouter location={req.path}>{router}</StaticRouter>
      </UDConfigProvider>
    </GlobalProvider>
  );
}

```

- 客户端 app.web.tsx

```TypeScript
import React from 'react';
import { ConfigProvider as UDConfigProvider, FloatingUIPopperSidecar } from '@universe-design/react';
import zhCN from '@universe-design/react/es/shared/locales/zh-CN';
import { BrowserRouter, useRoutes } from 'react-router-dom';
import { routes } from './routes';
import { GlobalProvider } from './components/provider';

export function App() {
  const router = useRoutes(routes);

  return (
    <GlobalProvider profile={window.user} path={window.location.pathname}>
      <UDConfigProvider locale={zhCN} PopperSidecar={FloatingUIPopperSidecar}>
        <BrowserRouter>{router}</BrowserRouter>
      </UDConfigProvider>
    </GlobalProvider>
  );
}

```

#### 数据路由

数据路由需要在渲染路由组件前请求数据。react-router v6天然集成了[remix](https://remix.run/)，天然支持在route上绑定loader函数，loader函数接受三个参数：

- **request**：fetch request实例
- **params**：路径参数
- **context**：服务端渲染传递的上下文参数，通过`requestContext`透传

在服务端渲染时会先执行loader函数再渲染路由组件，loader函数中需要异步请求路由所需要的数据并返回。客户端需要用到loader数据时使用`useLoaderData`方法即可。

分别对 routes.tsx、app.tsx 和 app.web.tsx 进行如下修改

- routes.tsx

新增 loader 方法，在该方法中调用服务端接口获取数据并返回

```TypeScript
export const routes: RouteObject[] = [
  {
    path: '/axe/document',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Navigate to={RPC_LIST_KEY} replace />, // 输入/axe/document重定向到/axe/document/rpcApiList
      },
      {
        path: '*',
        element: <Document />,
        /**
         * 路由渲染前会调用（服务端渲染完客户端不再调用），可以通过useLoaderData获取数据
         * @param args 包括request/params/context
         * - request: fetch request实例
         * - params: 路径参数
         * - context: 服务端渲染传递的上下文参数，通过requestContext透传
         * @returns
         */
        loader: async args => {
          try {
            const { request, params, context } = args;
            console.log('Route loader', request, params, context);

            const relativePath = params?.['*'];
            if (!relativePath) {
              return json({});
            }

            const data: LoaderData = {};
            // TODO: 获取数据逻辑

            console.log('Route loader data', data);
            return json(data);
          } catch (e) {
            console.error('Route loader error', e);
            return json({});
          }
        },
      },
    ],
  },
];
```

- app.web.tsx

```TypeScript
import React from 'react';
import { ConfigProvider as UDConfigProvider, FloatingUIPopperSidecar } from '@universe-design/react';
import zhCN from '@universe-design/react/es/shared/locales/zh-CN';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import { routes } from './routes';
import { GlobalProvider } from './components/provider';

export function App() {
  const router = createBrowserRouter(routes);

  return (
    <GlobalProvider profile={window.user} path={window.location.pathname}>
      <UDConfigProvider locale={zhCN} PopperSidecar={FloatingUIPopperSidecar}>
        <RouterProvider router={router} />
      </UDConfigProvider>
    </GlobalProvider>
  );
}

```

- app.tsx

```TypeScript
import React from 'react';
import { StaticRouterProvider } from 'react-router-dom/server';
import { HTTPRequest } from '@gulux/gulux/lib/exports/application-http';
import { ConfigProvider as UDConfigProvider, FloatingUIPopperSidecar } from '@universe-design/react';
import zhCN from '@universe-design/react/es/shared/locales/zh-CN';
import type { Router, StaticHandlerContext } from '@remix-run/router';
import { GlobalProvider } from './components/provider';
import { CurrentUser } from '@lark-meta/types';

interface AppProps {
  req: HTTPRequest;
  router: Router;
  context: StaticHandlerContext;
  profile?: CurrentUser;
}

export function App(props: AppProps) {
  const { router, context, req, profile } = props;

  return (
    <GlobalProvider req={req} profile={profile} path={req.path}>
      <UDConfigProvider locale={zhCN} PopperSidecar={FloatingUIPopperSidecar}>
        <StaticRouterProvider router={router} context={context} />
      </UDConfigProvider>
    </GlobalProvider>
  );
}

```

- index.tsx

这里需要注意的是`createFetchHandler`方法，这个方法将服务端框架（gulux）的请求转化为fetch的请求，供staticHandler.query调用。

```TypeScript
export async function renderApp(
  publicCDNDomain: string,
  cdnPathPrefix: string,
  req: HTTPRequest,
  ogwDomain: string,
  profile?: CurrentUser,
): Promise<string> {
  // 动态注入publicPath
  globalThis.__webpack_public_path__ = `${publicCDNDomain}/${cdnPathPrefix}`;

  // 路由匹配
  const canSSR = matchPath({ path: '/document', caseSensitive: true, end: false }, req.path);
  if (!canSSR) {
    return '';
  }

  const handler = createStaticHandler(routes);
  const fetchRequest = createFetchRequest(req); // 将gulux的请求转化为fetch的请求，供staticHandler.query调用
  const context = (await handler.query(fetchRequest, {
    requestContext: { headers: req.headers ?? req.header, ogwDomain },
  })) as StaticHandlerContext;
  const router = createStaticRouter(handler.dataRoutes, context);

  const rootContent = renderToString(<App req={req} router={router} context={context} profile={profile} />);
  return rootContent;
}
```

### 数据同构

完成路由同构后，刷新页面，我们会发现页面会闪一下，打开调试台抓一下请求，会发现浏览器在渲染页面后又重新发起了一次请求。这显然是不符合预期的，因为首屏的数据在 node 侧已经获取过一次了，客户端接管页面后应该复用服务端获取的数据，客户端切换路由时则从客户端发起请求。

#### 数据的注水和脱水

如何让客户端复用服务端已经获取过的数据，这就涉及到了数据的注水和脱水。所谓的数据注水就是服务端获取数据后，将"水分"（数据）注入HTML中；数据脱水就是客户端接管页面后将“水分”（数据）从HTML中脱出，用来渲染首屏。

#### Loader

React-router-dom v6 中的loader方法集成了数据注水和脱水的能力。

服务端渲染时会执行loader方法，该方法返回的数据会以全局变量挂载在window对象上以实现数据的注水。

![图片展示的是React服务端渲染中Mobx同构的数据脱水代码。在`<script>window.__staticRouterHydrationData = JSON.parse("...")</script>`标签内，呈现了脱水后的JSON数据，包含多个`items`，每个`items`有`id`、`name`、`type`、`parent_id`等字段，如`id`为`projects/apaaS/methods/v1/application/create.yml`的`items`，其`name`为`CreateAppV2`等。该图片与文档中介绍Mobx同构时需在mobx实例初始化时传入脱水数据的内容相关，直观呈现了脱水数据形式。](./image-12.png)

在需要使用数据的时候调用`useLoaderData`方法即可实现数据的脱水。

#### Mobx 同构

前端代码中经常会使用到一些外部的状态管理库，这里以mobx举例，实现mobx的同构。我们只需要在

mobx实例初始化的时候传入脱水的数据，并在全局维护一个`hydrate`的变量来标志数据是否已经被客户端初始化，通过该变量控制useEffect是否执行获取数据的逻辑。示例代码如下：

- store.ts

Store的`constructor`方法中接受初始化的数据

```TypeScript
export class APIDocStore {
  loading = false;

  detail: GetAPIDocumentResponse | null = null;

  constructor(detail?: GetAPIDocumentResponse) {
    if (detail) {
      this.detail = detail;
    }

    makeAutoObservable(this, { detail: observable.ref }, { autoBind: true });
  }

  getDocDetail = flow(function* (this: APIDocStore, fileUri: string, revisionId?: string) {
    try {
      this.loading = true;
      const data: GetAPIDocumentResponse | undefined = yield getDocDetail(fileUri, revisionId);

      if (data) {
        this.detail = data;
      }
    } catch (e) {
      console.error('Get doc detail error', e);
    } finally {
      this.loading = false;
    }
  });
}
```

- index.ts

在组件初次渲染时传入组件所需的首屏数据初始化mobx实例（服务端和客户端分别都会执行一次）；通过`hydrate`变量控制useEffect是否发起请求，客户端首屏渲染后需要将`hydrate`置为false，后续客户端切换路由由客户端发起请求获取数据。

```TypeScript
import React, { useEffect, useMemo } from 'react';
import { useDocument } from '@/pages/document/provider';
import { useHome } from '../../provider';
import { observer } from 'mobx-react-lite';
import { APIDocStore } from './store';
import { RpcApiDocRender, RpcApiDocRenderType } from '@lark-meta/components';
import { getFile } from '@/request/document';

export const APIDoc = observer(() => {
  const { loaderData, store: documentStore } = useDocument();
  const { selectedId } = documentStore;
  const { detail: loaderDetail } = loaderData;
  const { hydrate, setHydrate } = useHome();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const store = useMemo(() => new APIDocStore(loaderDetail), []);
  const { detail, loading, getDocDetail } = store;

  useEffect(() => {
    if (hydrate) {
      // 服务端已经注水了，客户端不需要再发请求，前端路由切换再发请求
      setHydrate(false);
      return;
    }

    getDocDetail(selectedId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  return (
    <RpcApiDocRender
      loading={loading}
      detail={
        detail
          ? {
              fileUri: detail.id,
              revisionId: detail.revision_id,
              name: detail.name,
              apiScopes: detail.api_scopes,
              fieldScopes: detail.field_scopes,
              updateTime: detail.update_time,
              projectName: detail.project_name,
              version: detail.project_version,
              content: detail.content,
            }
          : undefined
      }
      type={RpcApiDocRenderType.DOC}
      getFile={getFile}
    />
  );
});

```

### 渲染同构

由于node环境下不能使用dom相关的api，有时候需要在组件渲染的代码中通过`isNodeEnv`区分不同环境执行的代码，以免服务端渲染报错。

```TypeScript
export function Layout() {
  const { profile, path, req } = useGlobalData();
  const defaultDomain = (function () {
    if (isNodeEnv) {
      return req?.host ? `https://${req.host}` : '';
    } else {
      return `https://${window.location.hostname}`;
    }
  })();
  const [selectedKeys, setSelectedKeys] = useState(() => getSelectedKeys(path));

  return (
    <></>
  )
}
```

### 样式闪烁

有些情况下会出现服务端渲染后样式闪烁的问题，一般导致这类问题主要有两个原因：

#### **使用了 css-in-js 的方案处理样式**

css-in-js 的方案是将 css 代码封装在js对象中，通常会通过操作 DOM 动态生成style标签填充样式，由于服务端渲染不能操作 DOM，可能会导致两端渲染的样式不一致。例如 styled-components 和 antd v5都是用了 css-in-js 的方案，针对SSR的场景也给出了相应的解决方案

- **styled-components**

styled-components 提供了`ServerStyleSheet`api 创建样式表，收集所有 styled-components 生成的样式并生成内联 style 标签插入到 HTML 中来避免服务端渲染样式闪烁的问题。

```TypeScript
import express from 'express';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { ServerStyleSheet, StyleSheetManager } from 'styled-components';
import MyStyledComponent from './MyStyledComponent';

const app = express();

app.get('/', (req, res) => {
  const sheet = new ServerStyleSheet(); // 创建样式表
  
  try {
    // 使用 StyleSheetManager 将样式捕获到 sheet
    const html = ReactDOMServer.renderToString(
      <StyleSheetManager sheet={sheet.instance}>
        <MyStyledComponent />
      </StyleSheetManager>
    );
    
    // 获取所有通过 styled-components 生成的样式
    const styleTags = sheet.getStyleTags();
    
    // 生成最终的 HTML 响应，内嵌样式标签
    const responseBody = `
      <!DOCTYPE html>
      <html>
        <head>${styleTags}</head>
        <body>${html}</body>
      </html>
    `;
    
    res.send(responseBody);
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  } finally {
    sheet.seal();
  }
});

app.listen(3000);
```

- **antd v5**

> 参考 https://ant-design.antgroup.com/docs/react/server-side-rendering-cn

解决思路同styled-components，将样式从js中剥离出来（内联样式或者独立的css文件），注入到服务端返回的HTML中，让首屏就能加载出样式而不是通过执行js动态插入样式。

#### **在 useEffect 或者 useLayoutEffect 等hook中修改客户端的样式**

有些时候我们会习惯使用 useLayoutEffect 或者 useEffect 修改样式，由于服务端渲染执行不到 commit 阶段的生命周期，可能会导致两端渲染的样式不一致。所以，非必要情况不建议在 useLayoutEffect 或者 useEffect 里修改样式。

### SEO 优化

在服务端渲染中实现 seo 优化非常简单，我们直接使用[react-helmet](https://www.npmjs.com/package/react-helmet)即可。

```TypeScript
<Parent>
    <Helmet>
        <title>My Title</title>
        <meta name="description" content="Helmet application" />
    </Helmet>
 
    <Child>
        <Helmet>
            <title>Nested Title</title>
            <meta name="description" content="Nested component" />
        </Helmet>
    </Child>
</Parent>
```

## 缓存管理

在流量大的时候，执行服务端渲染会占用较多的服务器资源，有可能导致服务挂掉，所以我们需要根据业务的实际情况执行相应的缓存策略来降低服务器的压力。

在飞书域间文档项目中，采用了redis来缓存服务端渲染生成的html内容，缓存策略如下：（可根据实际情况调整）

- 过期时间1h
- revisionId：标识API文档的版本
- scmVersion：标识scm构建产物的版本
- path：标识请求的路径

redis的key为：`ssr-${scmVersion}-${revisionId}-${path}`

```TypeScript
@Get('/*')
async index(@Req() req: HTTPRequest, @Query('revisionId') queryRevisionId?: string) {
  const { path } = req;

  // 获取动态配置
  const configs = await getConfigs(path);

  // TODO：判断路由是否需要ssr
  if (!canSSr(path)) {
    const html = await this.views.render('index.handlebars', {
      ...configs,
      rootContent: '',
    });

    return html;
  }

  // 获取scm构建的相关信息
  const { cdnPathPrefix, scmVersion } = getAppInfo();

  // 获取revisionId
  const revisionId = queryRevisionId || (await getRevisionId(path));

  // 拼接redis key
  const cacheKey = `ssr-${scmVersion}-${path}-${revisionId}`;

  // 优先从缓存中取值
  const cacheHtml = await this.redisClient.get(cacheKey);
  const rootContent = cacheHtml ?? (await renderApp(publicCDNDomain, cdnPathPrefix, req).rootContent);

  const html = await this.views.render('index.handlebars', {
    ...configs,
    rootContent,
  });

  return html;
}
```

## 降级处理

即使我们通过了一定的缓存策略来降低服务器压力，但是在服务端获取数据失败、接口超时、服务端渲染代码执行失败等情况下也会导致服务端渲染失败。需要采取一定的降级措施来保证用户侧不会感知到服务端渲染失败。

- **接口逻辑兜底**

需要使用 try catch 包裹 `loader` 方法，在捕获到接口错误时返回空对象，客户端没有拿到注水的数据需要在浏览器再次发起请求。

```TypeScript
loader: async (args) => {
  try {
    const data: LoaderData = {};
    
    // 获取数据逻辑
    return json(data);
  } catch (e) {
    console.error('Route loader error', e);
    return json({});
  }
},
```

客户端需要判断返回的数据是否为空对象，决定是否在客户端再次发起请求

- **服务端渲染错误（超时）兜底**

由于存在代码不规范导致`renderToString`报错（reconciliation阶段使用了window/document等浏览器api）、接口调用超时等都会导致服务端渲染失败。需要针对这种情况进行降级处理。

1. 定义1000ms超时时间，超时放弃服务端渲染，降级为客户端渲染
2. 增加try/catch捕获，`renderToString`报错时降级为客户端渲染
3. 浏览器window对象上增加降级处理标识，客户端代码读取到降级标识，放弃`ReactDOM.hydrate`，走`ReactDOM.render`逻辑

代码改造如下：

**Node BFF**

```TypeScript
@Get('/document*')
async document(@Req() req: HTTPRequest, @Res() res: HTTPResponse) {
  const { path } = req;
  if (path === '/document' || path === '/document/') {
    // 重定向到/axe/document/guide/rpcApiList
    res.redirect(`/axe/document/${RPC_LIST_KEY}`);
    return;
  }

  let { publicCDNDomain = '' } = this.configStore.bffConfig;
  const { user: userInfo } = this.userStore;
  const user = JSON.stringify(userInfo ?? {});

  if (isEnvDevelopment) {
    // 开发环境将publicCDNDomain设置为localhost
    publicCDNDomain = 'http://localhost:4000';
  }

  try {
    // 设置1000ms的超时时间
    const rootContent = (await timeout(this.ssr(req, publicCDNDomain), 1000)) ?? '';

    // 设置响应头x-ssr为1，标识ssr成功
    res.set('x-ssr', '1');

    const html = await this.views.render('doc.handlebars', {
      publicCDNDomain,
      user,
      rootContent,
      ssrError: false,
    });

    return html;
  } catch (e) {
    // 设置响应头x-ssr为0，标识ssr失败
    res.set('x-ssr', '0');

    if (e instanceof TimeoutError) {
      // ssr超时
      this.logger.error(`[view controller] ssr timeout. error=${e.message}, path=${path}`);
    } else {
      // ssr出错
      this.logger.error(`[view controller] ssr error. error=${e}, path=${path}`);
    }

    const html = await this.views.render('index.handlebars', {
      publicCDNDomain,
      user,
      rootContent: '',
      ssrError: true, // 将ssr失败的标记注入window中，降级为客户端渲染
    });

    return html;
  }
}
```

**客户端**

```TypeScript
const root = document.getElementById('root');

if (process.env.DEV_NODE === 'csr' || window.__SSR_ERROR__) {
  // 开发环境和ssr出错都降级为csr
  ReactDOM.render(<App />, root);
} else {
  ReactDOM.hydrate(<App />, root);
}
```

# 开箱即用的 SSR 框架

现在业界有很多成熟的服务端渲染框架，已经封装好了很多服务端渲染的实现逻辑，可以根据实际的业务需求选用。

## Edenx

https://edenx.bytedance.net/

## Next

https://nextjs.org/

## Remix

https://remix.run/
