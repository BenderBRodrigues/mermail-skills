# Mermail MCP platform configuration

Read this reference when selecting an authentication mode, tool profile, or exact client configuration. The hosted Streamable HTTP endpoint is `https://console.mermail.app/mcp`.

## Authentication and profile selection

| Need | Endpoint | Authentication | Capability boundary |
| --- | --- | --- | --- |
| Normal external Mermail work | `/mcp` | Prefer OAuth; API key fallback | Full base catalog |
| Least-privilege verification inbox | `/mcp?profile=agent-inbox` | OAuth or API key | Exact 12-tool mailbox-provisioning and safe-email-read set |
| Live PayBox financial tools | `/mcp` | Full-profile OAuth as a current workspace member | Model-visible live `paybox_*` and safe invocation status through the owner's active PayBox connection |
| PayBox connection management / legacy Agent Wallet | `/mcp` | Full-profile OAuth as workspace owner | Connect/reauth handoffs and owner-only legacy compatibility tools |

OAuth uses the same Enoki account as the Mermail console and binds the grant to the workspace selected during browser consent. Core scope is `mcp:tools`; `openid` and `offline_access` may accompany it. Legacy `wallet:read` and `wallet:transact` labels are compatibility-only and do not unlock tools.

API-key mode uses a workspace-scoped Mermail API key mapped from `MERMAIL_API_KEY` to the `x-api-key` header. API-key mode cannot unlock Agent Wallet or `paybox_*` tools.

## Codex

Use OAuth through the official Plugins Directory after Mermail is published there. The GitHub plugin path uses an API-key environment header:

```json
{
  "type": "http",
  "url": "https://console.mermail.app/mcp",
  "env_http_headers": {
    "x-api-key": "MERMAIL_API_KEY"
  }
}
```

Set `MERMAIL_API_KEY` in the environment that launches Codex, restart the client, then inspect `/mcp`. Do not place an API key in an official Directory App configuration.

## Claude and Claude Code

Prefer the Claude connectors UI with OAuth. For Claude Code API-key fallback:

```json
{
  "type": "http",
  "url": "https://console.mermail.app/mcp",
  "headers": {
    "x-api-key": "${MERMAIL_API_KEY}"
  }
}
```

Use `/mcp` or `claude mcp get mermail` to inspect connection state. Run `/reload-plugins` after plugin updates.

Claude commonly exposes host-qualified identifiers such as `Mermail:list_mailboxes` and `Mermail:list_emails`; another host may expose a different namespace or bare names. Never manually add, strip, or invent the qualifier. The protocol `tools/list` names remain bare `list_mailboxes` and `list_emails`.

## Cursor

Prefer OAuth: add `https://console.mermail.app/mcp` or use the Cursor deeplink from [mermail.app/agents](https://mermail.app/agents), then select Authenticate.

If OAuth is unavailable, use:

```json
{
  "type": "http",
  "url": "https://console.mermail.app/mcp",
  "headers": {
    "x-api-key": "${env:MERMAIL_API_KEY}"
  }
}
```

Open MCP settings to inspect the server after restarting Cursor. An already-running desktop process does not receive an environment variable exported later in an unrelated shell.

## OpenClaw and headless clients

Use the client's secret store, process supervisor, CI secret injection, or another non-recording credential input to provide `MERMAIL_API_KEY` to the launching process. Do not type a real key in an interactive `export` command that may remain in shell history. For generic MCP configuration, preserve the same Streamable HTTP URL and `x-api-key` mapping; do not place the actual key in examples, logs, command arguments, or tracked files.

## Mailbox identifiers

For mailbox-scoped tools, prefer `public_id` from `list_mailboxes` as `mailboxId`. A hosted alias id or current email may also resolve, but never infer a mailbox from display name or mix identifiers across workspaces.
