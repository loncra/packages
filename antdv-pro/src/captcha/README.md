# `CaptchaSendButton` 验证码套件

与 framework captcha 模块对接的验证码发送套件：`CaptchaSendButton` 点击即完成 `generateCaptchaToken` -> 行为验证（可插拔，默认 tianai 滑窗）-> `generateCaptcha` 全链，并内置发送冷却倒计时；配套 composables 覆盖登录拦截（100429）、注册等需要"行为验证参数"的场景。

## 何时使用 {#when-to-use}

- 登录 / 注册 / 找回密码等页面需要发送短信、邮箱验证码，且后端开启了发送前行为验证（业务侧 `interceptorType` 配置）。
- 业务接口要求携带行为验证参数后重发请求：登录返回 100429 来自 Security 认证失败处理器（携带 `captchaToken`），`/sms/send` 等由 `CaptchaVerificationFilter` 按 `framework.captcha.verify-urls` 拦截。

## 代码演示 {#examples}

```tsx
const captchaSendButtonRef = ref<InstanceType<typeof CaptchaSendButton>>()

<form @finish="sendCaptchaFormRef.validate().then(() => captchaSendButtonRef?.trigger())">
  <a-input v-model:value="phoneNumber" @keydown.enter.prevent="captchaSendButtonRef?.trigger()"/>
  <captcha-send-button
    ref="captchaSendButtonRef"
    captcha-type="sms"
    :append="{phoneNumber, messageType: 'system.sms.captcha.login'}"
    :countdown-format="$t('captcha.countdown')"
    @sent="onSent"
  >
    <template #icon><icon-font type="loncra-send"/></template>
  </captcha-send-button>
</form>

function onSent(result: CaptchaSendResult) {
  authForm.value = {...authForm.value, ...result.captchaParams}
}
```

登录被拦截（100429）后补验证参数：

```ts
const {run: runBehaviorCaptcha} = useBehaviorCaptcha()

catch (error) {
  if (error.executeCode === '100429' && error.data) {
    const token = (error.data as {captchaToken: CaptchaToken}).captchaToken
    const params = await runBehaviorCaptcha(token)
    if (!params) {
      return
    }
    authForm.value = {...authForm.value, ...params}
    await reLogin()
  }
}
```

业务提交（如重置密码）携带短信验证码值：

```ts
const append = buildCaptchaSubmitParams(token, captchaValue, {phoneNumber})
```

## 行为 {#behavior}

- **全链编排**：点击按钮 -> `GET /captcha/generateToken`（`type` 为 `sms` / `email` / `tianai`）-> 响应含 `interceptToken`（即后端要求行为验证）时，按 `interceptToken.type` 适配行为验证器弹出验证 -> 成功后拼验证参数调 `POST /captcha/generateCaptcha`；响应无 `interceptToken` 时直接调 `generateCaptcha`。
- **行为验证结果**：tianai 滑窗成功回调的 `result.data` 是服务端可校验的验证值（track JSON 摘要），后续请求以 `args.post.captchaParamName` 指定的参数名携带。`generateToken` 响应自描述全部参数名（`tokenParamName` / `captchaParamName` / `args.generate.jsUrl`），控件不硬编码。
- **token 生命周期**：行为验证通过只消费验证结果，token 仍用于 `generateCaptcha`；业务验证码校验成功后服务端销毁 token（默认行为），重复获取验证码需重新走全链。
- **冷却**：`generateCaptcha` 成功后按钮进入冷却禁用态并按响应的 `expired` 倒计时，结束后恢复。切换 `captchaType` 会立即重置冷却。
- **取消静默**：用户关闭滑窗不视为错误，`canceled` 事件上报，不弹全局错误提示。
- **前置校验**：`beforeSend` 返回 `false` 中止本次发送（用于"先查账户/先选账户"类前置流程），冷却不启动。
- **脚本加载**：tianai 滑窗脚本按响应的 `jsUrl` 动态加载（`id` 取 `type`，重复加载幂等）；滑窗请求的地址前缀为 `modulePrefix(SYSTEM_MODULE_NAME.RESOURCE_SERVER)`（单体 `/api`、微服务 `/api/{module}`），与其它 resource 请求同源同前缀，要求 `createClient` 已执行。
- **验证器可插拔**：`BehaviorVerifier` 按 `type` 适配（`supports` / `verify`）；未适配的 `type` 抛错。默认实现为 tianai，供应商替换时经 `verifier` 属性注入新实现（以初始值为准），编排不变。

## API

### 属性 {#props}

| 属性 | 说明 | 类型 | 默认值 | 版本 |
| --- | --- | --- | --- | --- |
| captchaType | 验证码类型（`generateToken` 的 `type`） | `'sms' \| 'email' \| 'tianai'` | - | - |
| append | 发送请求的附加参数（`phoneNumber` / `email` / `messageType` 等） | `Record<string, unknown>` | - | - |
| countdownFormat | 冷却倒计时格式（`Statistic.Timer` 的 `format`） | `string` | - | - |
| beforeSend | 发送前置校验，返回 `false` 中止 | `() => Promise<boolean> \| boolean` | - | - |
| verifier | 行为验证器覆盖 | `BehaviorVerifier` | tianai 实现 | - |
| disabled | 禁用（叠加在冷却之上） | `boolean` | `false` | - |
| classes | 语义化类名：`timer` 覆盖倒计时文字 | `{timer?: string}` | - | - |
| styles | 语义化样式：`timer` 覆盖倒计时文字 | `{timer?: Record<string, string \| number>}` | - | - |
| prefixCls | 组件前缀覆盖 | `string` | `loncra-captcha-send-button` | - |
| rootClass | 根节点附加类名 | `string` | - | - |

### 事件 {#events}

| 事件 | 说明 | 类型 | 版本 |
| --- | --- | --- | --- |
| sent | 发送成功（含 `generateCaptcha` 响应） | `(result: CaptchaSendResult) => void` | - |
| canceled | 用户关闭行为验证弹窗 | `() => void` | - |
| failed | 链路中任意请求失败 | `(error: unknown) => void` | - |

### 插槽 {#slots}

| 插槽 | 说明 | 类型 | 版本 |
| --- | --- | --- | --- |
| icon | 按钮图标（非冷却/非加载态展示；未传时默认 `SendOutlined`） | `() => unknown` | - |

### 方法 {#methods}

| 方法 | 说明 | 类型 | 版本 |
| --- | --- | --- | --- |
| trigger | 以编程方式触发一次完整发送（供表单 Enter 键提交等场景复用） | `() => Promise<void>` | - |

## 类型 {#types}

### CaptchaSendResult {#captchasendresult}

| 参数 | 说明 | 类型 | 默认值 | 版本 |
| --- | --- | --- | --- | --- |
| token | 本次验证码 token（一次性，验证通过即销毁） | `CaptchaToken` | - | - |
| captchaParams | 可直接展开进业务请求的验证参数（`captchaType` + token 参数；不含 `append` 与行为验证结果，行为验证参数用 `useBehaviorCaptcha`） | `Record<string, unknown>` | - | - |
| generateResult | `generateCaptcha` 响应（`codeLength` / `expired`） | `CaptchaGenerationResult` | - | - |

### BehaviorVerifier {#behaviorverifier}

行为验证器契约（A 类，按 `type` 适配）：

| 方法 | 说明 | 类型 | 版本 |
| --- | --- | --- | --- |
| supports | 是否处理该验证类型 | `(type: string) => boolean` | - |
| verify | 弹出行为验证；resolve 验证结果（服务端可校验的值），resolve `undefined` 表示用户取消 | `(token: CaptchaInterceptToken) => Promise<string \| undefined>` | - |

## 语义化 DOM {#semantic-dom}

| 节点 | 说明 |
| --- | --- |
| `{prefixCls}-countdown` | 冷却倒计时容器（`sent` 后出现） |
| `classes.timer` / `styles.timer` | 作用于倒计时文字内容 |
