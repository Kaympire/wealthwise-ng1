declare module '@mono.co/connect.js' {
  interface MonoConnectConfig {
    key: string
    onSuccess: (data: { code: string }) => void
    onClose?: () => void
    onLoad?: () => void
    onEvent?: (eventName: string, data: unknown) => void
    reference?: string
    scope?: string
    data?: Record<string, unknown>
  }

  export default class MonoConnect {
    constructor(config: MonoConnectConfig)
    setup(): void
    open(): void
    reauthorise(accountId: string): void
  }
}
