export class IntegrationConfigError extends Error {
  constructor(message: string) { super(message); this.name = "IntegrationConfigError"; }
}
export class TelegramError extends Error {
  constructor(message: string) { super(message); this.name = "TelegramError"; }
}
export class NewsletterError extends Error {
  constructor(message: string) { super(message); this.name = "NewsletterError"; }
}
export class AutomationError extends Error {
  constructor(message: string) { super(message); this.name = "AutomationError"; }
}
