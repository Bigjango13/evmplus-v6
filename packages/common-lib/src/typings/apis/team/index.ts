/**
 * Copyright (C) 2020 Andrew Rioux
 *
 * This file is part of CAPUnit.com.
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
import { FullTeamObject, NewTeamObject } from '../../types';

export * as members from './members';

export interface CreateTeam {
	(params: {}, body: NewTeamObject): APIEither<FullTeamObject>;

	url: '/api/team';

	method: 'post';

	requiresMember: 'required';

	needsToken: true;

	useValidator: true;
}

export interface GetTeam {
	(params: { id: string }, body: {}): APIEither<FullTeamObject>;

	url: '/api/team/:id';

	method: 'get';

	requiresMember: 'optional';

	needsToken: false;

	useValidator: true;
}

export interface ListTeams {
	(params: {}, body: {}): APIEither<FullTeamObject[]>;

	url: '/api/team';

	method: 'get';

	requiresMember: 'optional';

	needsToken: false;

	useValidator: true;
}

export interface DeleteTeam {
	(params: { id: string }, body: {}): APIEither<void>;

	url: '/api/team/:id';

	method: 'delete';

	requiresMember: 'required';

	needsToken: true;

	useValidator: true;
}

export interface SetTeamData {
	(params: { id: string }, body: Partial<NewTeamObject>): APIEither<void>;

	url: '/api/team/:id';

	method: 'put';

	requiresMember: 'required';

	needsToken: true;

	useValidator: false;
}
