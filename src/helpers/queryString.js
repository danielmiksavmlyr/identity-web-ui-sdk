import map from 'lodash-es/map';
import pickBy from 'lodash-es/pickBy';

import { camelCaseProperties, snakeCaseProperties } from './transformObjectProperties';

export function parseQueryString(value) {
    const qs = value.split('&').reduce((acc, param) => {
        const [key, value = ''] = param.split('=');

        return key && key.length
                ? {
                        ...acc,
                        [key]: decodeURIComponent(value.replace(/\+/g, ' '))
                }
                : acc;
    }, {});

    return camelCaseProperties(qs);
}

export function toQueryString(obj, snakeCase = true) {
    const params = snakeCase ? snakeCaseProperties(obj) : obj;

    return map(pickBy(params, v => v !== null && v !== undefined), (value, key) =>
        value !== '' ? `${key}=${encodeURIComponent(value)}` : key
    ).join('&');
}
