# rip-ts

<br />
<div align="center">
  <h3 align="center">REST in piece</h3>

  <p align="center">
    Build JSON API clients fast
    <br />
    <a href="https://github.com/ipwnd/rip-ts/issues">Report Bug</a>
    ·
    <a href="https://github.com/iwpnd/rip-ts/issues">Request Feature</a>
  </p>
</div>

## About The Project

Found myself rewriting the same rest client all over again and wanted to put a
stop to that. This will be the base of every upcoming http clients going forward.

### Installation

```sh
yarn install @iwpnd/rip-ts

# or

npm install @iwpnd/rip-ts
```

## Usage

```typescript
import { RestClient } from '@iwpnd/rip-ts';

type User = {
    id: string;
    name: string;
    isActive: boolean;
    isAdmin: boolean;
};

const client = new RestClient('http://localhost:3000');

// GET
await client.get<User>('/users');

/*
 * Resolve parameter
 */
await client.get<User>('/users/:id', {
    params: { id: 1 },
});

/*
 * Resolve query string
 */
await client.get<User[]>('/users', {
    query: { isActive: true, isAdmin: true },
});
// > http://localhost:3000/users?isActive=true&isAdmin=true

await client.put('/users/:id', {
    params: { id: 1 },
    body: { name: 'Rick Roll' },
});

// POST
await client.post('/users', {
    body: { id: 2, name: 'Jean Claude van Damme' },
});

// PUT
await client.put('/users/:id', {
    params: { id: 1 },
    body: { name: 'Rick Roll' },
});

// DELETE
await client.delete('/users/:userId', { params: { userId: 1 } });
```

## Contributing

Contributions are neither expected nor encouraged. If you for whatever
reason you want to contribute here, create an issue describing your problem first.
Unsolicited PRs are going to be deleted straight up.

If we evaluated that you're in the right repository,
are of a clear state of mind and have cause to do what you wanna do, please
follow the steps below.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feat/my-amazing-feature`)
3. Commit your Changes (`git commit -m 'feat: some amazing feature'`)
4. Push to the Branch (`git push origin feat/my-amazing-feature`)
5. Open a Pull Request

## License

Distributed under the MIT License. See `LICENSE.txt` for more information.

## Contact

Benjamin Ramser - [@iwpnd](https://twitter.com/iwpnd) - iwpnd@posteo.com

Project Link: [https://github.com/iwpnd/rip-ts](https://github.com/iwpnd/rip-ts)

## Acknowledgments

-   [Zachary J. Payne](https://www.amazon.de/-/en/Zachary-J-Payne/dp/B08NRVZ7NW)
