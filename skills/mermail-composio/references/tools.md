# Composio tools

| Tool | Role |
| --- | --- |
| `list_composio_toolkits` | Discover toolkits; filter with `query.search` / `query.status` |
| `connect_composio_toolkit` | Start connect; returns `redirectUrl` |
| `sync_composio_connections` | Pull connection state after browser auth |
| `list_composio_connections` | Inspect connected toolkit statuses |
| `search_composio_tools` | Find action slugs (`query.search`, optional `query.toolkit`) |
| `get_composio_tool_schema` | Input schema + `risk` / `allowed` / `connected` |
| `execute_composio_tool` | Run a connected tool (`body.slug`, `body.arguments`) |
| `disconnect_composio_toolkit` | Destructive disconnect (needs confirmation token) |
| `get_composio_calendar_account` | Google Calendar connection + email when available |

CLI mirrors the same operations under `mermail composio …`.
