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

import { NHQ } from 'common-lib';
import { convertNHQDate, modifyAndBind } from '..';
import { CAPWATCHError, CAPWATCHModule } from '../ImportCAPWATCHFile';

const oFlight: CAPWATCHModule<NHQ.OFlight> = async (fileData, schema) => {
	if (
		typeof fileData[0].CAPID === 'undefined' ||
		typeof fileData[0].Wing === 'undefined' ||
		typeof fileData[0].Unit === 'undefined' ||
		typeof fileData[0].Amount === 'undefined' ||
		typeof fileData[0].Syllabus === 'undefined' ||
		typeof fileData[0].Type === 'undefined' ||
		typeof fileData[0].FltDate === 'undefined' ||
		typeof fileData[0].TransDate === 'undefined' ||
		typeof fileData[0].FltRlsNum === 'undefined' ||
		typeof fileData[0].AcftTailNum === 'undefined' ||
		typeof fileData[0].FltTime === 'undefined' ||
		typeof fileData[0].LstUsr === 'undefined' ||
		typeof fileData[0].LstDateMod === 'undefined' ||
		typeof fileData[0].Comments === 'undefined'
	) {
		return CAPWATCHError.BADDATA;
	}

	const oFlightCollection = schema.getCollection<NHQ.OFlight>('NHQ_OFlight');

	for (const oFlightConst of fileData) {
		try {
			const values: NHQ.OFlight = {
				CAPID: parseInt(oFlightConst.CAPID + '', 10),
				Wing: oFlightConst.Wing,
				Unit: oFlightConst.Unit,
				Amount: parseInt(oFlightConst.Amount, 10),
				Syllabus: parseInt(oFlightConst.Syllabus, 10),
				Type: parseInt(oFlightConst.Type, 10),
				FltDate: convertNHQDate(oFlightConst.FltDate).toISOString(),
				TransDate: convertNHQDate(oFlightConst.TransDate).toISOString(),
				FltRlsNum: oFlightConst.FltRlsNum,
				AcftTailNum: oFlightConst.AcftTailNum,
				FltTime: parseInt(oFlightConst.FltTime, 10),
				LstUsr: oFlightConst.LstUsr,
				LstDateMod: oFlightConst.LstDateMod,
				Comments: oFlightConst.Comments,
			};
			try {
				await oFlightCollection.add(values).execute();
			} catch (e) {
				console.warn(e);
				await modifyAndBind(oFlightCollection, {
					CAPID: values.CAPID,
					Wing: values.Wing,
					Unit: values.Unit,
					Amount: values.Amount,
					Syllabus: values.Syllabus,
					Type: values.Type,
					FltDate: values.FltDate,
					TransDate: values.TransDate,
					FltRlsNum: values.FltRlsNum,
					AcftTailNum: values.AcftTailNum,
					FltTime: values.FltTime,
					LstUsr: values.LstUsr,
					LstDateMod: values.LstDateMod,
					Comments: values.Comments,
				})
					.patch(values)
					.execute();
			}
		} catch (e) {
			console.warn(e);
			return CAPWATCHError.INSERT;
		}
	}

	return CAPWATCHError.NONE;
};

export default oFlight;
