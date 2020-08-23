/**
 * Copyright (C) 2020 Andrew Rioux
 *
 * This file is part of CAPUnit.com.
 *
 * This file documents basic member functions that don't necessarily
 * go with another functional group
 *
 * See `common-lib/src/typings/api.ts` for more information
 *
 * CAPUnit.com is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * CAPUnit.com is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with CAPUnit.com.  If not, see <http://www.gnu.org/licenses/>.
 */

import { APIEither } from '../../api';
import {
	AbsenteeInformation,
	Member,
	MemberReference,
	MemberType,
	PasswordSetResult
} from '../../types';

export * as account from './account';
export * as attendance from './attendance';
export * as capwatch from './capwatch';
export * as flight from './flight';
export * as permissions from './permissions';
export * as promotionrequirements from './promotionrequirements';
export * as temporarydutypositions from './temporarydutypositions';

/**
 * Lets a member set their own absentee information
 */
export interface SetAbsenteeInformation {
	(params: {}, body: AbsenteeInformation): APIEither<void>;

	url: '/api/member/absent';

	method: 'post';

	requiresMember: 'required';

	needsToken: true;

	useValidator: true;
}

/**
 * Resets the password for a member
 */
export interface PasswordReset {
	(params: {}, body: { password: string }): APIEither<PasswordSetResult>;

	url: '/api/member/passwordreset';

	method: 'post';

	requiresMember: 'required';

	needsToken: true;

	useValidator: true;
}

/**
 * Gets information for all the members in the unit
 */
export interface Members {
	(params: { type?: MemberType }, body: {}): APIEither<Member[]>;

	url: '/api/member/:type?';

	method: 'get';

	requiresMember: 'required';

	needsToken: false;

	useValidator: true;
}

/**
 * Developer tool, strictly locked down
 */
export interface Su {
	(params: {}, body: MemberReference): APIEither<void>;

	url: '/api/member/su';

	method: 'post';

	requiresMember: 'required';

	needsToken: true;

	useValidator: true;
}

/**
 * Developer tool, strictly locked down
 *
 * Clones the current session, returning a session ID to the new
 * session. Allows for creating a new session without signing in
 */
export interface CLone {
	(params: {}, body: {}): APIEither<string>;

	url: '/api/member/clone';

	method: 'post';

	requiresMember: 'required';

	needsToken: true;

	useValidator: false;
}
