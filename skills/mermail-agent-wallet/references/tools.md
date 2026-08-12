# Agent Wallet tool map

These tools appear only on Mermail MCP **OAuth** sessions that grant `wallet:read` and/or `wallet:transact`. API-key MCP catalogs never include them. Read live schemas from MCP `tools/list`.

## Read (`wallet:read`)

- `get_paybox_connection`: lightweight PayBox status for one mailbox (OAuth; may appear even before wallet scopes). Returns `connect_handoff.console_url` when not connected, `reauth_handoff.console_url` when reauth is required, or `SCOPE_UPGRADE_REQUIRED` + `required_scopes` when Mermail MCP wallet scopes are missing. Present the console link; never send users to Claude/ChatGPT/Codex connector settings.
- `get_agent_wallet`: connection, credentials summary, portfolio, limits, and proposal statuses for one mailbox. May include `connect_handoff` / `reauth_handoff` / `funding_handoff`. `connection.status` of `PAYBOX_UNAVAILABLE` with an empty portfolio means PayBox did not answer that read, not a disconnect.
- `list_agent_wallet_credentials`: delegated wallet credentials only; secrets, cards, and raw signing credentials are never returned.
- `get_agent_wallet_portfolio`: portfolio view for the connected PayBox workspace.
- `paybox_get_portfolio`: direct PayBox holdings when that tool is registered. Asset `token` addresses are returned in the clear, so read the transfer asset from here instead of guessing an address.
- `paybox_get_request`: read one PayBox request status, including `signing_handoff.console_url` while it is pending signature.
- `get_agent_wallet_request`: poll a known Mermail provider request id; never creates or retries a transfer.
- `get_paybox_invocation`: poll safe status of a direct PayBox invocation from this OAuth grant; approval URLs and signing plans are never returned.

## Write (`wallet:transact`)

### Primary (in-app parity)

- `paybox_request_transfer`: **default for every new transfer** — Circle USDC, native ETH/SOL, and any other reviewed catalog token. Destructive; requires `prepare_destructive_action`. Pass `token` (portfolio address or `"native"`) and human amount in `amount_decimal`. May be absent from `tools/list` even when other `paybox_*` tools are live; if so, say unavailable — do **not** fall back to creating a USDC proposal.
- `paybox_request_swap`: **default for token A → token B swaps** (same as in-app Assistant). Destructive; requires `prepare_destructive_action`. Read the live schema (commonly `credential_id`, `src_chain`, `src_token`, `dst_token`, `amount`). Do not substitute a transfer or USDC proposal. May be absent from `tools/list` when not in the reviewed catalog.

### Legacy proposals (only when user explicitly manages an existing proposal)

- `create_agent_wallet_transfer_proposal`: create a local USDC proposal for review (`mailboxId`, `chain`, `amount`, `destination`). USDC only. Reuses a matching `PENDING_REVIEW` proposal. Does not submit or sign. **Do not use for a normal “send money” request.**
- `submit_agent_wallet_transfer`: submit a reviewed proposal. Destructive; requires `prepare_destructive_action` with exact arguments, `confirmationDestination`, and `acknowledgeIrreversibleMainnetTransfer: true`. If pending, prefer PayBox MCP App UI when present; else paste `signing_handoff.console_url`. Pending is not success. Do not retry after `wallet_proposal_already_handled` / `wallet_proposal_not_pending` / `wallet_paybox_credential_unavailable`.
- `reject_agent_wallet_transfer_proposal`: cancel one `PENDING_REVIEW` proposal (`proposalId`, `version`). Destructive; requires `prepare_destructive_action`. Does not cancel submitted or PayBox-parked transfers.

## Related PayBox direct tools

When PayBox is connected, additional reviewed `paybox_*` tools may appear for the same OAuth grant. Every gated `paybox_*` write still needs a `prepare_destructive_action` token bound to that exact tool name and arguments.

- **Any reviewed catalog token including USDC (send):** use `paybox_request_transfer` with `token` set to the asset (address from `paybox_get_portfolio`, or `"native"`) and the human amount in `amount_decimal` (omit `amount`; for any token whose decimals Mermail can resolve it rejects base units with `paybox_amount_requires_decimal`, and only an asset it cannot resolve takes `amount` in smallest units); Mermail converts it to base units and rejects mis-scaled or sub-cent amounts. Every rejection code and its recovery is listed in [security.md](security.md). Tools may declare `_meta.ui.resourceUri` / `ui/resourceUri` for a PayBox MCP App. When status is `pending_signature` / `pending_approval`, prefer that in-chat PayBox frame (Generate Signing Key there). Paste `signing_handoff.console_url` only if no frame appears. Never expect a pasteable signing plan or approval URL.
- **Swap token A → token B:** use `paybox_request_swap` with live-schema arguments. Prefer the PayBox MCP App when `pending_signature` / `finish_signing_in_paybox_embedded_app`; stop the model turn — PayBox owns signing and settlement. Do not auto-poll; poll once only if the user asks or confirms finish. Never claim success merely because the swap was prepared.
- Poll with `get_paybox_invocation` or `paybox_get_request` **once** after the user finishes signing (transfers), or on explicit user status/finish for swaps.

Buy / checkout / approval / signing-plan URLs from tools such as `paybox_get_buy_link` are redacted for the model. Prefer `get_agent_wallet` → `funding_handoff.console_url` (Mermail deep link with `fund=1`). If `needs_mailbox` is true, resolve `mailboxId` via `get_agent_wallet` instead of guessing. See [SKILL.md](../SKILL.md).

## Sequencing

1. Auth/scopes check → mailbox discovery → `get_paybox_connection` / `get_agent_wallet`.
2. **Connect / reauth:** if `connect_handoff` or `reauth_handoff` is present, paste `console_url` once and wait for the user to finish in Mermail Agent Wallet. Do not open host connector settings.
3. **Funding / onramp:** paste non-null `funding_handoff.console_url` or `...?fund=1&amount=…` once; after the user finishes, re-read portfolio. Do not loop on redacted buy links or guess mailboxes.
4. **Transfer (USDC, ETH/SOL, or other catalog token):** exact preview → `prepare_destructive_action` → single `paybox_request_transfer` → prefer PayBox MCP App UI when `_meta.ui.resourceUri` / host frame is present; else paste `signing_handoff.console_url` when pending → one-shot status poll.
5. **Swap:** exact preview → `prepare_destructive_action` → single `paybox_request_swap` → prefer PayBox MCP App / stop turn on `pending_signature`; console `signing_handoff` only if no frame; poll once only on user ask/finish.
6. **Legacy proposal only if user explicitly asks:** create/submit/reject proposal tools — never as the default send or swap path.
7. Poll with `get_agent_wallet_request` / `get_paybox_invocation` / `paybox_get_request` only after a known id exists.
