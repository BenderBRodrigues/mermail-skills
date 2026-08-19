# x402 agent tools

This workflow **uses** tools owned by other official skills. Do not add them to this skill in `tool-coverage.json`.

Pass structured arguments as **native JSON objects**. Never stringify `query` or `body`. Use the exact host identifier (`paybox_pay_x402` or `Mermail:paybox_pay_x402`). Prefer mailbox `public_id` as `mailboxId`.

PayBox tools appear only on full-profile MCP **OAuth**. API keys and the agent-inbox profile never expose them. Read live schemas from `tools/list`. Additional reviewed `paybox_*` tools (including `paybox_discover_services` and `paybox_use_service`) may appear without a separate coverage row; use them when live, still under `mermail-agent-wallet` contracts.

## Mailbox

| Tool | Owner | Role |
| --- | --- | --- |
| `list_mailboxes` | `mermail-administer-workspace` | Discover a mailbox when a connection read needs `mailboxId` |

## PayBox / Agent Wallet

| Tool | Owner | Role |
| --- | --- | --- |
| `get_paybox_connection` | `mermail-agent-wallet` | Connection status; `connect_handoff` / `reauth_handoff` / `OWNER_ACTION_REQUIRED` |
| `paybox_discover_services` | `mermail-agent-wallet` | Read-only catalog search from the user task (for example Apify TikTok) |
| `paybox_use_service` | `mermail-agent-wallet` | Preferred: one pay + fetch of the selected resource |
| `paybox_pay_x402` | `mermail-agent-wallet` | Alternate: one payment; then retry the exact resource with `x_payment` |
| `paybox_get_request` | `mermail-agent-wallet` | Reconcile one known `request_id` after signing or when status is asked |
| `paybox_get_buy_link` | `mermail-agent-wallet` | Separate funding handoff; never treats funding as payment approval |
| `paybox_get_portfolio` | `mermail-agent-wallet` | Holdings when you must confirm the spend asset exists |

Do not call `prepare_destructive_action` for `paybox_*` tools. Never substitute `paybox_request_payment`, `paybox_request_transfer`, or a legacy proposal for x402.

Aliases such as `discover_services`, `use_service`, and `pay_x402` may appear; prefer the `paybox_*` names when both exist.

## Examples

```json
{
  "mailboxId": "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee"
}
```

Do not pass a stringified JSON body.
