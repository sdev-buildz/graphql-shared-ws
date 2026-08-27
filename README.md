<header>
  <h1 align="center">
    GraphQL over Shared WebSocket
  </h1>
  <p align="center">
    GraphQL over WebSocket clients sharing a single socket across browsing contexts.
  </p>
</header>

## ✨ Features

- Share a single web socket across all the clients across all the browsing contexts (across browser tabs, windows, iframes, etc...).
- GraphQL subscriptions are indexed by their payloads, preventing duplicate requests and responses across browsing contexts.
- A swap-in [graphql-ws](https://github.com/enisdenjo/graphql-ws) wrapper with an identical API.

## 📦 Installation

```sh
npm install graphql-shared-ws
```

## 💻 Usage

### 🚀 Initialize and subscribe <a id="initialize-and-subcribe"></a>

```ts
import { createSharedClient } from 'graphql-shared-ws'

// create a client.
const sharedClient = createSharedClient({
  url: 'wss://example.com/api/graphql',
})

// make a grpahql subscription
sharedClient.subscribe(
  {
    query: `
     subscription listenToMessages {
       messageBroadcasted
     }
   `,
  },
  {
    next: (n) => {
      console.log(`Last broadcasted message =`, n.data.messageBroadcasted)
    },
    complete: () => {
      console.log('subscription closed.')
    },
    error: console.error,
  }
)
```

## 📦 Migration from graphql-ws library

🚀 In most cases, updating the import statements will be sufficient.

```ts
//  Before migration
import { createClient } from 'graphql-ws'

//  After migration
import { createSharedClient as createClient } from 'graphql-shared-ws'
```

In case you are using custom WebSocket implementation, refer this [custom WebSocket guide](CUSTOM_WEB_SOCKET.md).

## 🔌 API Reference

This library implements the exact same API as graphql-ws, except for the `webSocketImpl` field. For complete usage guides, configuration options, and type definitions, please refer to the [official graphql-ws documentation](https://the-guild.dev/graphql/ws). If you are using a custom WebSocket implementation, see the [custom WebSocket guide](CUSTOM_WEB_SOCKET.md).

## 👥 Community & Support

- 💬 _**Have an idea?**_ Suggest new features in [GitHub Discussions](../..//discussions).

- 🚀 _**Support me or my projects**_ through [donations](https://buymeacoffee.com/stevenx.dev).

- 💼 _**Need custom work or consultation?**_ I am available for hire! Reach out via [email](mailto:stevexdev@zohomail.in).
