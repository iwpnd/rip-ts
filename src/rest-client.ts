import qs from 'querystring';
import { Response, fetch } from 'undici';
import { RequestError, RequestTimeoutError } from './errors';
import { Params, RequestOptions } from './types';

const DEFAULT_REQUEST_TIMEOUT = 30_000;

const resolveParamsPlaceholder = (path: string, params?: Params): string => {
    if (!params) {
        return path;
    }

    return Object.entries(params).reduce(
        (acc, [name, value]) =>
            acc.replace(`:${name}`, encodeURIComponent(value)),
        path
    );
};

const isJSON = (contentType: string): boolean => {
    // More generic pattern to match JSON content types
    const pattern = /^application\/([a-zA-Z0-9!#$&^_.+-]*\+)?json(;.*)?$/i;
    return pattern.test(contentType);
};

export class RestClient {
    private readonly url: string;

    private readonly options?: RequestOptions;

    constructor(url: string, options?: RequestOptions) {
        this.url = url;
        this.options = options;
    }

    async request<T extends object | null = object>(
        path: string,
        options?: RequestOptions
    ): Promise<T> {
        const requestPath = resolveParamsPlaceholder(path, options?.params);

        const requestQuery = options?.query
            ? `?${qs.stringify(options.query)}`
            : '';

        const requestBody =
            typeof options?.body === 'object'
                ? JSON.stringify(options.body)
                : undefined;

        const requestHeaders = {
            Accept: 'application/json',
            ...this.options?.headers,
            ...(requestBody && { 'Content-Type': 'application/json' }),
            ...options?.headers,
        };

        const requestURL = `${this.url}${requestPath}${requestQuery}`;

        const timeout =
            options?.timeout ??
            this.options?.timeout ??
            DEFAULT_REQUEST_TIMEOUT;
        const controller = new AbortController();
        const { signal } = controller;
        const requestTimer = setTimeout(() => {
            controller.abort();
        }, timeout);

        let response: Response = new Response();
        try {
            response = await fetch(requestURL, {
                ...this.options,
                method: 'GET',
                ...options,
                headers: requestHeaders,
                body: requestBody,
                signal,
            });
        } catch (err) {
            if (err instanceof DOMException && err.name === 'AbortError') {
                throw new RequestTimeoutError();
            }
            throw new RequestError('Something went wrong.', response, null);
        } finally {
            clearTimeout(requestTimer);
        }

        let content: T | null = null;
        const contentType = response.headers.get('Content-Type');

        if (contentType && isJSON(contentType.toLowerCase())) {
            content = (await response.json()) as T;
        }

        if (response.ok) {
            return content as T;
        }

        throw new RequestError(response.statusText, response, content);
    }

    async get<T extends object | null = object>(
        path: string,
        options?: RequestOptions
    ): Promise<T> {
        return this.request<T>(path, options);
    }

    async post<T extends object | null = object>(
        path: string,
        options?: RequestOptions
    ) {
        return this.request<T>(path, { ...options, method: 'POST' });
    }

    async put<T extends object | null = object>(
        path: string,
        options?: RequestOptions
    ) {
        return this.request<T>(path, { ...options, method: 'PUT' });
    }

    async delete<T extends object | null = object>(
        path: string,
        options?: RequestOptions
    ) {
        return this.request<T>(path, { ...options, method: 'DELETE' });
    }
}
