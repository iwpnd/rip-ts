import { MockAgent, setGlobalDispatcher } from 'undici';
import { RestClient } from '.';
import { RequestError, RequestTimeoutError } from './errors';

export const getError = async <TError>(
    call: () => unknown
): Promise<TError> => {
    try {
        await call();

        throw new Error('Failed to throw Error');
    } catch (error: unknown) {
        return error as TError;
    }
};

const mockAgent = new MockAgent({ connections: 1 });

setGlobalDispatcher(mockAgent);
mockAgent.disableNetConnect();

describe('http-client', () => {
    const url = 'https://localhost:3000';
    const client = new RestClient(url);

    const mockPool = mockAgent.get(url);

    describe('request', () => {
        it.each([
            'application/json',
            'application/json; charset=utf-8',
            'application/json;charset=utf-8',
            'application/geo+json',
            'application/vnd.geo+json',
        ])('should request with content type: %s', async (contentType) => {
            mockPool
                .intercept({
                    path: '/resource/foobar?foo=bar',
                    method: 'GET',
                    headers: {
                        Accept: 'application/json',
                    },
                })
                .defaultReplyHeaders({ 'content-type': contentType })
                .reply(200, { message: 'hype' });

            await expect(
                client.request('/resource/:resource', {
                    params: { resource: 'foobar' },
                    query: { foo: 'bar' },
                    headers: { Accept: 'application/json' },
                })
            ).resolves.toEqual({
                message: 'hype',
            });
        });

        it.each(['application/geo', 'application/baguette; charset=utf-8'])(
            'should fail to parse invalid content type as json : %s',
            async (contentType) => {
                mockPool
                    .intercept({
                        path: '/resource/foobar?foo=bar',
                        method: 'GET',
                        headers: {
                            Accept: 'application/json',
                        },
                    })
                    .defaultReplyHeaders({ 'content-type': contentType })
                    .reply(200, { message: 'hype' });

                await expect(
                    client.request('/resource/:resource', {
                        params: { resource: 'foobar' },
                        query: { foo: 'bar' },
                        headers: { Accept: 'application/json' },
                    })
                ).resolves.toBeNull();
            }
        );

        it('should request without substition path parameters', async () => {
            mockPool
                .intercept({
                    path: '/resource',
                    method: 'GET',
                    headers: {
                        Accept: 'application/json',
                    },
                })
                .defaultReplyHeaders({ 'content-type': 'application/json' })
                .reply(200, { message: 'hype' });

            await expect(
                client.request('/resource', {
                    headers: { Accept: 'application/json' },
                })
            ).resolves.toEqual({
                message: 'hype',
            });
        });

        it('should perform GET request and throw RequestError on unknown error', async () => {
            mockPool
                .intercept({
                    path: '/resource/baguette',
                    method: 'GET',
                })
                .defaultReplyHeaders({ 'content-type': 'application/json' })
                .replyWithError(new Error());

            await expect(() =>
                client.get('/resource/:id', {
                    params: { id: 'baguette' },
                })
            ).rejects.toThrow(RequestError);
        });

        it('should perform GET request and throw on request timeout', async () => {
            const clientWithTimeout = new RestClient(url, { timeout: 50 });
            mockAgent
                .get(url)
                .intercept({ path: '/resource/baguette' })
                .reply(500, { statusCode: 500 })
                .delay(100);

            const err = await getError<RequestTimeoutError>(async () =>
                clientWithTimeout.get('/resource/:id', {
                    params: { id: 'baguette' },
                })
            );

            expect(err).toBeInstanceOf(RequestTimeoutError);
            expect(err.name).toBe('RequestTimeoutError');
        });
    });

    describe('GET', () => {
        it('should perform GET request', async () => {
            mockPool
                .intercept({
                    path: '/resource/baguette',
                    method: 'GET',
                })
                .defaultReplyHeaders({ 'content-type': 'application/json' })
                .reply(200, {});

            await expect(
                client.get('/resource/:id', {
                    params: { id: 'baguette' },
                })
            ).resolves.toEqual({});
        });

        it('should perform GET request and throw RequestError', async () => {
            mockPool
                .intercept({
                    path: '/resource/baguette',
                    method: 'GET',
                })
                .defaultReplyHeaders({ 'content-type': 'application/json' })
                .reply(404, { message: 'not found' });

            await expect(() =>
                client.get('/resource/:id', {
                    params: { id: 'baguette' },
                })
            ).rejects.toThrow(RequestError);
        });
    });

    describe('POST', () => {
        it('should perform POST request', async () => {
            mockPool
                .intercept({
                    path: '/resource/baguette',
                    method: 'POST',
                    headers: { 'content-type': 'application/json' },
                    body: JSON.stringify({ message: 'hype' }),
                })
                .defaultReplyHeaders({ 'content-type': 'application/json' })
                .reply(200, {});

            await expect(
                client.post('/resource/:id', {
                    params: { id: 'baguette' },
                    body: { message: 'hype' },
                })
            ).resolves.toEqual({});
        });

        it('should perform POST request and throw RequestError', async () => {
            mockPool
                .intercept({
                    path: '/resource/baguette',
                    method: 'POST',
                    headers: { 'content-type': 'application/json' },
                    body: JSON.stringify({ message: 'hype' }),
                })
                .defaultReplyHeaders({ 'content-type': 'application/json' })
                .reply(404, { message: 'not found' });

            await expect(() =>
                client.post('/resource/:id', {
                    params: { id: 'baguette' },
                    body: { message: 'hype' },
                })
            ).rejects.toThrow(RequestError);
        });
    });

    describe('PUT', () => {
        it('should perform PUT request', async () => {
            mockPool
                .intercept({
                    path: '/resource/baguette',
                    method: 'PUT',
                    headers: { 'content-type': 'application/json' },
                    body: JSON.stringify({ message: 'hype' }),
                })
                .defaultReplyHeaders({ 'content-type': 'application/json' })
                .reply(200, {});

            await expect(
                client.put('/resource/:id', {
                    params: { id: 'baguette' },
                    body: { message: 'hype' },
                })
            ).resolves.toEqual({});
        });

        it('should perform PUT request and throw RequestError', async () => {
            mockPool
                .intercept({
                    path: '/resource/baguette',
                    method: 'PUT',
                    headers: { 'content-type': 'application/json' },
                    body: JSON.stringify({ message: 'hype' }),
                })
                .defaultReplyHeaders({ 'content-type': 'application/json' })
                .reply(404, { message: 'not found' });

            await expect(() =>
                client.put('/resource/:id', {
                    params: { id: 'baguette' },
                    body: { message: 'hype' },
                })
            ).rejects.toThrow(RequestError);
        });
    });

    describe('DELETE', () => {
        it('should perform DELETE request', async () => {
            mockPool
                .intercept({
                    path: '/resource/baguette',
                    method: 'DELETE',
                })
                .defaultReplyHeaders({ 'content-type': 'application/json' })
                .reply(200, {});

            await expect(
                client.delete('/resource/:id', {
                    params: { id: 'baguette' },
                })
            ).resolves.toEqual({});
        });

        it('should perform DELETE request and throw RequestError', async () => {
            mockPool
                .intercept({
                    path: '/resource/baguette',
                    method: 'DELETE',
                })
                .defaultReplyHeaders({ 'content-type': 'application/json' })
                .reply(404, { message: 'not found' });

            await expect(() =>
                client.delete('/resource/:id', {
                    params: { id: 'baguette' },
                })
            ).rejects.toThrow(RequestError);
        });
    });
});
