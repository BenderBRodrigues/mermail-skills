# Agent Wallet tool map

These tools appear only on Mermail MCP **OAuth** sessions that grant `wallet:read` and/or `wallet:transact`. API-key MCP catalogs never include them. Read live schemas from MCP `tools/list`.

## Read (`wallet:read`)

- `get_agent_wallet`: connection, credentials summary, portfolio, limits, and proposal statuses for one mailbox. `connection.status` of `PAYBOX_UNAVAILABLE` with an empty portfolio means PayBox did not answer that read, not a disconnect.
- `list_agent_wallet_credentials`: delegated wallet credentials only; secrets, cards, and raw signing credentials are never returned.
- `get_agent_wallet_portfolio`: portfolio view for the connected PayBox workspace.
- `paybox_get_portfolio`: direct PayBox holdings when that tool is registered. Asset `token` addresses are returned in the clear, so read the transfer asset from here instead of guessing an address.
- `paybox_get_request`: read one PayBox request status, including `signing_handoff.console_url` while it is pending signature.
- `get_agent_wallet_request`: poll a known Mermail provider request id; never creates or retries a transfer.
- `get_paybox_invocation`: poll safe status of a direct PayBox invocation from this OAuth grant; approval URLs and signing plans are never returned.

## Write (`wallet:transact`)

- `create_agent_wallet_transfer_proposal`: create a local USDC proposal for review (`mailboxId`, `chain`, `amount`, `destination`). USDC only; ETH/SOL → `paybox_request_transfer`. Does not submit or sign.
- `submit_agent_wallet_transfer`: submit a reviewed proposal. Destructive; requires `prepare_destructive_action` with exact arguments, `confirmationDestination`, and `acknowledgeIrreversibleMainnetTransfer: true`. PayBox may still require passkey approval. Pending is not success.
- `paybox_request_transfer`: native ETH/SOL and any other reviewed catalog token (or direct PayBox USDC). Destructive; requires `prepare_destructive_action`. Not a USDC-proposal tool.

## Related PayBox direct tools

When PayBox is connected, additional reviewed `paybox_*` tools may appear for the same OAuth grant. Every gated `paybox_*` write still needs a `prepare_destructive_action` token bound to that exact tool name and arguments.

- **USDC:** prefer the Agent Wallet proposal flow unless the user explicitly asks for direct PayBox.
- **Any other PayBox catalog token** (or direct PayBox for any reviewed asset): use `paybox_request_transfer` with `token` set to the asset (address from `paybox_get_portfolio`, or `"native"`) and the human amount in `amount_decimal` (omit `amount`; for any token whose decimals Mermail can resolve it rejects base units with `paybox_amount_requires_decimal`, and only an asset it cannot resolve takes `amount` in smallest units); Mermail converts it to base units and rejects mis-scaled or sub-cent amounts. Every rejection code and its recovery is listed in [security.md](security.md). When status is `pending_signature` / `pending_approval`, paste `signing_handoff.console_url` so the user can Generate Signing Key and sign in the Agent Wallet console. Never expect a pasteable signing plan or approval URL.
- Poll with `get_paybox_invocation` or `paybox_get_request` **once** after the user finishes signing.

Buy / checkout / approval / signing-plan URLs from tools such as `paybox_get_buy_link` are redacted for the model. Prefer `get_agent_wallet` → `funding_handoff.console_url` (Mermail deep link with `fund=1`). If `needs_mailbox` is true, resolve `mailboxId` via `get_agent_wallet` instead of guessing. See [SKILL.md](../SKILL.md).

## Sequencing

1. Auth/scopes check → mailbox discovery → `get_agent_wallet`.
2. **Funding / onramp:** paste non-null `funding_handoff.console_url` or `...?fund=1&amount=…` once; after the user finishes, re-read portfolio. Do not loop on redacted buy links or guess mailboxes.
3. **USDC transfer:** create proposal → human preview → `prepare_destructive_action` → single `submit_agent_wallet_transfer`.
4. **Other catalog tokens / direct PayBox:** confirm asset → `prepare_destructive_action` → `paybox_request_transfer` → paste `signing_handoff.console_url` when pending → one-shot status poll.
5. Poll with `get_agent_wallet_request` / `get_paybox_invocation` / `paybox_get_request` only after a known id exists.
