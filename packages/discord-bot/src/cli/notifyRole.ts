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

import * as mysql from '@mysql/xdevapi';
import { ServerConfiguration, Maybe } from 'common-lib';
import { Client, GuildChannel, TextChannel, Role } from 'discord.js';
import { getAccount } from 'server-common';
import { byName, byProp } from '../data/setupUser';

export default async (
	mysqlClient: mysql.Client,
	conf: ServerConfiguration,
	client: Client,
	args: string[],
) => {
	if (args.length < 4) {
		throw new Error(
			'Command requires account ID, role name, channel name, and message to send',
		);
	}

	console.log(args);

	const [accountID, roleNamesCombined, channelName, ...messageBits] = args;
	const message = messageBits.join(' ');
	const roleNames = roleNamesCombined.split(',');

	const session = await mysqlClient.getSession();
	const schema = session.getSchema(conf.DB_SCHEMA);

	const account = await getAccount(schema)(accountID).fullJoin();
	const { discordServer } = account;

	if (Maybe.isNone(discordServer)) {
		throw new Error('Account does not have an associated Discord server');
	}

	const guild = client.guilds.get(discordServer.value.serverID);

	if (!guild) {
		throw new Error('There was an issue getting guild information');
	}

	const rolesToMention: Role[] = [];

	for (const roleName of roleNames) {
		const role = guild.roles.find(byName(roleName));

		if (!role) {
			throw new Error(`Could not find role by the name of "${roleName}"`);
		}

		rolesToMention.push(role);
	}

	if (rolesToMention.length === 0) {
		throw new Error('No roles are being mentioned');
	}

	const channel = guild.channels.find(byProp<GuildChannel>('name')(channelName));

	if (!channel) {
		throw new Error('There was an issue getting the staff channel');
	}

	if (channel.type !== 'text') {
		throw new Error('Staff channel is not a text channel');
	}

	const textChannel = channel as TextChannel;

	const mentionPartOfMessage = rolesToMention.map(role => `<@&${role.id}>`).join(', ');

	await textChannel.send(`${mentionPartOfMessage} ${message}`);
};
