import * as fetch2 from 'isomorphic-fetch';

export default function (url: string, options: RequestInit = {}): Promise<Response> {
	if (process && process.env && process.env.NODE_ENV === 'test') {
		return fetch2('http://localhost:3001' + url, options);
	} else {
		return fetch(url, options);
	}
}