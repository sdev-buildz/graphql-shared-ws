<header>
  <h1 align="center">
    Custom WebSocket Implementation Guide
  </h1>
  <p align="center">
  </p>
</header>

This library exports SharedWebSocket, a WebSocket implementation which creates a native WebSocket inside SharedWorker and acts as a bridge between the native WebSocket and your code.

In case you want to use a different custom WebSocket implementation, you can use any of these following methods.

1. In case your implementation is a wrapper around the native WebSocket, replace the native WebSocket with the SharedWebSocket (inside your custom WebSocket implementation).

2. In case your implementation should replace the native WebSocket itself, use your implementation inside SharedWorker as shown in the following steps.

### Steps to use Custom WebSocket Implementation inside SharedWorker

_**Note:**_ These steps explain using only your custom implementation. To learn about SharedWorker, refer [the MDN docs](https://developer.mozilla.org/en-US/docs/Web/API/SharedWorker).

**Step 1:** Inside your SharedWorker script, register your custom implementation as shown in this example code.

```ts
//  ./src/workers/shared-worker.ts

//  Import your custom WebSocket implementation.
import { customWebSocket } from './customWebSocket'
import { connectListener } from 'graphql-shared-ws/for-worker-thread'

declare const globalThis: SharedWorkerGlobalScope
globalThis.addEventListener('connect', (event) =>
  connectListener(
    event,
    // Pass your custom WebSocket implementation
    customWebSocket
  )
)
```

**Step 2:** In the main-thread (outside SharedWorker), register the URL to your SharedWorker before initalizing client.

```ts
//  ./src/client.ts
import { createSharedClient } from 'graphql-shared-ws'
import { customSharedWorkerScript } from 'graphql-shared-ws'

//  Set this to the url to the SharedWorker.
//  [NOTE]: This is not the relative path from the current file to the SharedWorker source file. This is the relative path in the bundled output.
customSharedWorkerScript.url = `./workers/shared-worker.ts`

//  You can also use self hosted url.
customSharedWorkerScript.url = `https://example.com/workers/shared-worker`
```

After following the steps, you can [initalize and use the client](README.md#initialize-and-subcribe) as normal.
