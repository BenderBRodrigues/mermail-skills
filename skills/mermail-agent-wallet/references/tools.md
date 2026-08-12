# Agent Wallet tool map

These tools appear only on Mermail MCP **OAuth** full-profile sessions for the **workspace owner**. API-key catalogs and the agent-inbox profile never include them. Legacy `wallet:read` / `wallet:transact` scope strings are compatibility-only and are not used for tool visibility. Read live schemas from MCP `tools/list`.

**Do not call `prepare_destructive_action` for `paybox_*` or legacy Agent Wallet submit/reject tools.** PayBox owns transaction policy, signing, and approval. `prepare_destructive_action` remains for non-PayBox Mermail destructive tools (mailbox/workspace admin, etc.). Core OAuth grant is `mcp:tools`.

## Read

- `get_paybox_connection`: lightweight PayBox status for one mailbox. Returns `connect_handoff.console_url` when not connected or `reauth_handoff.console_url` when reauth is required. Present the console link; never send users to Claude/ChatGPT/Codex connector settings.
- `get_agent_wallet`: connection, credentials summary, portfolio, and proposal statuses for one mailbox. May include `connect_handoff` / `reauth_handoff` / `funding_handoff`. `connection.status` of `PAYBOX_UNAVAILABLE` with an empty portfolio means PayBox did not answer that read, not a disconnect.
- `list_agent_wallet_credentials`: delegated wallet credentials only; secrets, cards, and raw signing credentials are never returned.
- `get_agent_wallet_portfolio`: portfolio view for the connected PayBox workspace.
- `paybox_get_portfolio`: direct PayBox holdings when that tool is registered. Asset `token` addresses are returned in the clear, so read the transfer asset from here instead of guessing an address.
- `paybox_get_request`: authoritative provider business status for one known transfer/swap `request_id`; use it to distinguish pending from terminal settlement. May include `signing_handoff.console_url` while pending signature.
- `get_agent_wallet_request`: poll a known Mermail provider request id; never creates or retries a transfer.
- `get_paybox_invocation`: read safe MCP invocation/audit state for one OAuth-grant invocation. This can show that the proxied tool call completed while its provider transfer/swap remains pending; never use it as proof of settlement or as the sole reason to block a distinct new action. Approval URLs and signing plans are never returned.

## Write

### Primary (in-app parity)

- `paybox_request_transfer`: **default for every new transfer** — Circle USDC, native ETH/SOL, and any other reviewed catalog token. Pass arguments exactly as the live schema requires. Do **not** call `prepare_destructive_action`. May be absent from `tools/list` even when other `paybox_*` tools are live; if so, say unavailable — do **not** fall back to creating a USDC proposal.
- `paybox_request_swap`: **default for token A → token B swaps**. Read the live schema (commonly `credential_id`, `src_chain`, `src_token`, `dst_token`, `amount`). Do not substitute a transfer or USDC proposal. Do **not** call `prepare_destructive_action`.
- `paybox_pay_x402`: **only for an explicitly selected x402 paid resource/action** when this model-visible tool appears in live `tools/list`. Read its live description/schema. Do not substitute `paybox_request_payment`, a transfer, or a proposal; those are different operations. Do **not** call `prepare_destructive_action`.

### Legacy proposals (only when user explicitly manages an existing proposal)

- `create_agent_wallet_transfer_proposal`: create a local USDC proposal for review (`mailboxId`, `chain`, `amount`, `destination`). USDC only. Reuses a matching `PENDING_REVIEW` proposal. Does not submit or sign. **Do not use for a normal “send money” request.**
- `submit_agent_wallet_transfer`: submit a reviewed proposal with `{ proposalId, version }` only. Do **not** call `prepare_destructive_action`. If pending, prefer PayBox MCP App UI when present; else paste `signing_handoff.console_url` when present. Pending is not success. Do not retry after `wallet_proposal_already_handled` / `wallet_proposal_not_pending` / `wallet_paybox_credential_unavailable`.
- `reject_agent_wallet_transfer_proposal`: cancel one `PENDING_REVIEW` proposal (`proposalId`, `version`). Do **not** call `prepare_destructive_action`. Does not cancel submitted or PayBox-parked transfers.

## Related PayBox direct tools

When PayBox is connected, additional reviewed `paybox_*` tools may appear for the same OAuth grant. Mermail does not add Mermail confirmation tokens to those writes.

- **Send (including USDC):** use `paybox_request_transfer` with live-schema args. Tools may declare `_meta.ui.resourceUri` / `ui/resourceUri` for a PayBox MCP App. When status is `pending_signature` / `pending_approval`, prefer that in-chat PayBox frame. Paste `signing_handoff.console_url` only if no frame appears and the result includes it. Never expect a pasteable signing plan or approval URL.
- **Swap token A → token B:** use `paybox_request_swap` with live-schema arguments. Prefer the PayBox MCP App on `pending_signature`; stop the model turn — PayBox owns signing and settlement. Do not auto-poll; poll once only if the user asks or confirms finish. Never claim success merely because the swap was prepared. Do not invent a console signing URL if the swap result has no `signing_handoff`.
- **x402 paid service:** exploration is read-only. Before `paybox_pay_x402`, require a user-selected service/origin, resource/action, and maximum spend; validate the live 402 quote within that envelope and preview exact terms. Funding is a separate browser workflow and never authorizes payment. Call once, preserve provider UI, stop on pending, and never retry an uncertain payment.
- Poll transfer/swap settlement with `paybox_get_request` **once** after the user finishes signing, asks for status, or explicitly requests a new wallet action while an old provider request is pending in chat. Use `get_paybox_invocation` only for MCP invocation/audit state. Never poll by starting another write; after reconciliation, a clearly distinct new action uses a new request ID and its own single write.

Buy / checkout / approval / signing-plan URLs from tools such as `paybox_get_buy_link` are redacted for the model. Prefer `get_agent_wallet` → `funding_handoff.console_url` (Mermail deep link with `fund=1`). If `needs_mailbox` is true, resolve `mailboxId` via `get_agent_wallet` instead of guessing. See [SKILL.md](../SKILL.md).

For exact sequencing, read [workflows.md](workflows.md). Keep this file as the live tool map; do not infer workflow authority from tool availability alone.
