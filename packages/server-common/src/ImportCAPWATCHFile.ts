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

import { Schema, Session } from '@mysql/xdevapi';
import { spawn } from 'child_process';
import { CAPWATCHImportErrors } from 'common-lib';
import * as csv from 'csv-parse';
import cadetActivities from './capwatch-modules/cadetactivities';
import cadetDutyPosition from './capwatch-modules/cadetdutypositions';
import cadetAchv from './capwatch-modules/cadetachv';
import cadetAchvAprs from './capwatch-modules/cadetachvaprs';
import dutyPosition from './capwatch-modules/dutyposition';
import mbrAchievements from './capwatch-modules/mbrachievement';
import mbrContact from './capwatch-modules/mbrcontact';
import memberParse from './capwatch-modules/member';
import oFlight from './capwatch-modules/oflight';
import organization from './capwatch-modules/organization';

export { CAPWATCHImportErrors as CAPWATCHError };

export type CAPWATCHModule<T> = (fileData: T[], schema: Schema) => Promise<CAPWATCHImportErrors>;

const modules: {
	module: CAPWATCHModule<any>;
	file: string;
}[] = [
	{
		module: memberParse,
		file: 'Member.txt'
	},
	{
		module: dutyPosition,
		file: 'DutyPosition.txt'
	},
	{
		module: mbrContact,
		file: 'MbrContact.txt'
	},
	{
		module: cadetDutyPosition,
		file: 'CadetDutyPositions.txt'
	},
	{
		module: cadetActivities,
		file: 'CadetActivities.txt'
	},
	{
		module: oFlight,
		file: 'OFlight.txt'
	},
	{
		module: mbrAchievements,
		file: 'MbrAchievements.txt'
	},
	{
		module: cadetAchv,
		file: 'CadetAchv.txt'
	},
	{
		module: cadetAchvAprs,
		file: 'CadetAchvAprs.txt'
	},
	/*	{
		module: seniorAwards,
		file: 'SeniorAwards.txt'
	},
	{
		module: seniorLevel,
		file: 'SeniorLevel.txt'
	},
	{
		module: mbrAddresses,
		file: 'MbrAddresses.txt'
	},
	{
		module: mbrChars,
		file: 'MbrChars.txt'
	},*/
	/* the following modules need only be imported occassionally as they do not change often */
	/*	{
		module: cdtAchvEnum,
		file: 'CadetAchievementsEnumeration.txt'
	},
	{
		module: achievements,
		file: 'Achievements.txt'
	},
	{
		module: commanders,
		file: 'Commanders.txt'
	},*/
	{
		module: organization,
		file: 'Organization.txt'
	} /*
	{
		module: orgAddresses,
		file: 'OrganizationAddresses.txt'
	},
	{
		module: orgContact,
		file: 'OrganizationContacts.txt'
	},
	{
		module: orgMeeting,
		file: 'OrganizationMeetings.txt'
	}*/
];

interface CAPWATCHModuleResult {
	error: CAPWATCHImportErrors;
	file: string;
}

export default async function*(
	zipFileLocation: string,
	schema: Schema,
	session: Session,
	files: string[] = modules.map(mod => mod.file)
): AsyncIterableIterator<CAPWATCHModuleResult> {
	await session.startTransaction();

	const foundModules: { [key: string]: boolean } = {};

	for (const i of files) {
		foundModules[i] = false;
	}

	for (const mod of modules) {
		if (files.indexOf(mod.file) === -1) {
			continue;
		}

		foundModules[mod.file] = true;

		const rows: any[] = [];

		const zippedFile = spawn('unzip', ['-op', zipFileLocation, mod.file]).stdout;

		const parser = csv({
			columns: true
		});

		parser.on('readable', () => {
			let record;
			// tslint:disable-next-line: no-conditional-assignment
			while ((record = parser.read())) {
				rows.push(record);
			}
		});

		yield new Promise<CAPWATCHModuleResult>(res => {
			parser.on('end', async () => {
				res({
					error: await mod.module(rows, schema),
					file: mod.file
				});
			});

			zippedFile.pipe(parser);
		});
	}

	for (const i in foundModules) {
		if (foundModules.hasOwnProperty(i) && !foundModules[i]) {
			console.error('Invalid file passed to ImportCAPWATCHFile:', i);
		}
	}

	await session.commit();
}
