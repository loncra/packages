export interface AgentStreamHandlers {
  onUpdate(data: string): void
  onSuccess(): void
  onError(error: unknown): void
}

export interface AgentStreamConnection {
  abort(): void
}

export interface AgentStreamTransport {
  open(url: string, headers: Record<string, string>, handlers: AgentStreamHandlers): AgentStreamConnection
}
