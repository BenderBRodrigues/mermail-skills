# Agent Wallet tool map

These tools appear only on Mermail MCP **OAuth** sessions that grant `wallet:read` and/or `wallet:transact`. API-key MCP catalogs never include them. Read live schemas from MCP `tools/list`.

## Read (`wallet:read`)

- `get_agent_wallet`: connection, credentials summary, portfolio, limits, and proposal statuses for one mailbox.
- `list_agent_wallet_credentials`: delegated wallet credentials only; secrets, cards, and raw signing credentials are never returned.
- `get_agent_wallet_portfolio`: portfolio view for the connected PayBox workspace.
- `get_agent_wallet_request`: poll a known Mermail provider request id; never creates or retries a transfer.
- `get_paybox_invocation`: poll safe status of a direct PayBox invocation from this OAuth grant; approval URLs are never returned.

## Write (`wallet:transact`)

- `create_agent_wallet_transfer_proposal`: create a local USDC proposal for review (`mailboxId`, `chain`, `amount`, `destination`). Does not submit or sign.
- `submit_agent_wallet_transfer`: submit a reviewed proposal. Destructive; requires `prepare_destructive_action` with exact arguments, `confirmationDestination`, and `acknowledgeIrreversibleMainnetTransfer: true`. PayBox may still require passkey approval. Pending is not success.

## Related PayBox direct tools

When PayBox is connected, additional reviewed `paybox_*` tools may appear for the same OAuth grant. Every gated `paybox_*` write still needs a `prepare_destructive_action` token bound to that exact tool name and arguments. Prefer the Agent Wallet proposal flow for USDC transfers unless the user explicitly asks for a reviewed direct PayBox tool.

Buy / checkout / approval URLs from tools such as `paybox_get_buy_link` are redacted for the model. Do not use them to paste MoonPay links into chat. For funding, prefer the console handoff in [SKILL.md](../SKILL.md) (Funding / onramp section).

## Sequencing

1. Auth/scopes check → mailbox discovery → `get_agent_wallet`.
2. **Funding / onramp:** deep-link to Agent Wallet **Funding** in console; after the user finishes, re-read portfolio. Do not loop on redacted buy links.
3. **Transfer:** create proposal → human preview → `prepare_destructive_action` → single `submit_agent_wallet_transfer`.
4. Poll with `get_agent_wallet_request` / `get_paybox_invocation` only after a known id exists.
