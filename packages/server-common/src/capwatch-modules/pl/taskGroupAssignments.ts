// Copyright (C) 2022 Glenn Rioux
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as
// published by the Free Software Foundation, either version 3 of the
// License, or (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

import { validator } from 'auto-client-api';
import { NHQ, Validator } from 'common-lib';
import { CAPWATCHError, CAPWATCHModule, isFileDataValid } from '../../ImportCAPWATCHFile';
import { convertCAPWATCHValidator } from '../lib/validator';

const recordValidator = convertCAPWATCHValidator(
	validator<NHQ.PL.TaskGroupAssignments>(Validator) as Validator<NHQ.PL.TaskGroupAssignments>,
);

const plTaskGroupAssignments: CAPWATCHModule<NHQ.PL.TaskGroupAssignments> = async function* (
	backend,
	fileData,
	schema,
	isORGIDValid,
	trustedFile,
) {
	if (!trustedFile) {
		return yield {
			type: 'Result',
			error: CAPWATCHError.NOPERMISSIONS,
		};
	}

	if (!isFileDataValid(recordValidator)(fileData)) {
		return yield {
			type: 'Result',
			error: CAPWATCHError.BADDATA,
		};
	}

	try {
		const collection = schema.getCollection<NHQ.PL.TaskGroupAssignments>(
			'NHQ_PL_TaskGroupAssignments',
		);

		if (!(await collection.existsInDatabase())) {
			await schema.createCollection('NHQ_PL_TaskGroupAssignments');
		}

		try {
			await collection.remove('true').execute();
		} catch (e) {
			console.warn(e);
			return yield {
				type: 'Result',
				error: CAPWATCHError.CLEAR,
			};
		}

		let currentRecord = 0;

		const promises = [];

		for (const taskGroupAssignment of fileData) {
			const values = {
				GroupID: parseInt(taskGroupAssignment.GroupID, 10),
				TaskID: parseInt(taskGroupAssignment.TaskID, 10),
				TaskGroupAssignmentID: parseInt(taskGroupAssignment.TaskGroupAssignmentID, 10),
			};

			promises.push(collection.add(values).execute());

			currentRecord++;

			if (currentRecord % 15 === 0) {
				yield {
					type: 'Update',
					currentRecord,
				};
			}
		}

		await Promise.all(promises);

		return yield {
			type: 'Result',
			error: CAPWATCHError.NONE,
		};
	} catch (e) {
		console.warn(e);
		return yield {
			type: 'Result',
			error: CAPWATCHError.INSERT,
		};
	}
};

export default plTaskGroupAssignments;
