/**
 * Copyright (C) 2020 Andrew Rioux
 *
 * This file is part of EvMPlus.org.
 *
 * EvMPlus.org is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * EvMPlus.org is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with EvMPlus.org.  If not, see <http://www.gnu.org/licenses/>.
 */

import { AccountObject, asyncRight, Either, errorGenerator, get, Maybe } from 'common-lib';
import { GuildMember } from 'discord.js';
import { Backends, MemberBackend, RawMySQLBackend } from 'server-common';
import getMember from './getMember';

export const toCAPUnit = (backend: Backends<[MemberBackend, RawMySQLBackend]>) => (
	account: AccountObject,
) => (guildMember: GuildMember) =>
	asyncRight(
		getMember(backend.getSchema())(guildMember),
		errorGenerator('Could not get member information'),
	)
		.map(Maybe.map(get('member')))
		.map(Maybe.map(backend.getMember(account)))
		.flatMap(member =>
			member.hasValue ? member.value.map(Maybe.some) : Either.right(Maybe.none()),
		);
