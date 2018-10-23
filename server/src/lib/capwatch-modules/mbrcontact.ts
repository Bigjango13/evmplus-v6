import { CAPWATCHError, CAPWATCHModule } from '../ImportCAPWATCHFile';
import { convertNHQDate } from '../MySQLUtil';

const mbrContact: CAPWATCHModule<NHQ.MbrContact> = async (
	fileData,
	schema,
	orgid
) => {
	if (
		typeof fileData[0].CAPID === 'undefined'
	) {
		return CAPWATCHError.BADDATA;
	}

	let values: NHQ.MbrContact & {orgid: number};

	try {
		const mbrContactCollection = schema.getCollection<NHQ.MbrContact & {orgid: number}>(
			'NHQ_MbrContact'
		);

		try {
			await mbrContactCollection
				.remove('orgid = :orgid')
				.bind('orgid', orgid)
				.execute();
		} catch (e) {
			console.warn(e);
			return CAPWATCHError.CLEAR;
		}

		const promises = [];

		for await (const duties of fileData) {
			values = {
				CAPID: parseInt(duties.CAPID.toString(), 10),
				Type: duties.Type,
				Priority: duties.Priority,
				Contact: duties.Contact,
				UsrID: duties.UsrID,
				DateMod: convertNHQDate(duties.DateMod) as any as string,
				DoNotContact: duties.DoNotContact,
				orgid
			};

			promises.push(mbrContactCollection.add(values).execute());
		}

		await Promise.all(promises);

		return CAPWATCHError.NONE;
	} catch (e) {
		console.warn(e);
		return CAPWATCHError.INSERT;
	}
};

export default mbrContact;
